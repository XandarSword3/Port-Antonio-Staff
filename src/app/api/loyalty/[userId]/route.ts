import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: {
    userId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const lookupType = searchParams.get('type') || 'userId'; // 'userId', 'email', or 'phone'

    // Verify staff access
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: staffUser } = await supabase
        .from('staff_users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!staffUser) {
        return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
      }
    }

    // Build query based on lookup type
    let accountQuery = supabase
      .from('loyalty_accounts')
      .select(`
        id,
        user_id,
        email,
        phone,
        points,
        tier,
        total_earned,
        total_redeemed,
        created_at,
        updated_at
      `);

    switch (lookupType) {
      case 'email':
        accountQuery = accountQuery.eq('email', userId);
        break;
      case 'phone':
        accountQuery = accountQuery.eq('phone', userId);
        break;
      default:
        accountQuery = accountQuery.eq('user_id', userId);
    }

    const { data: account, error: accountError } = await accountQuery.single();

    if (accountError && accountError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching loyalty account:', accountError);
      return NextResponse.json({ error: 'Failed to fetch loyalty account' }, { status: 500 });
    }

    if (!account) {
      return NextResponse.json({ 
        account: null,
        transactions: [],
        message: 'No loyalty account found'
      });
    }

    // Fetch recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('loyalty_transactions')
      .select(`
        id,
        transaction_type,
        points,
        reason,
        reference_type,
        reference_id,
        metadata,
        created_at,
        expires_at,
        staff_users!staff_user_id (
          username,
          first_name,
          last_name
        )
      `)
      .eq('loyalty_account_id', account.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (transactionsError) {
      console.error('Error fetching loyalty transactions:', transactionsError);
      return NextResponse.json({ error: 'Failed to fetch loyalty transactions' }, { status: 500 });
    }

    // Calculate some additional metrics
    const totalEarned = transactions?.filter(t => t.transaction_type === 'earn')
      .reduce((sum, t) => sum + t.points, 0) || 0;
    
    const totalRedeemed = transactions?.filter(t => ['redeem', 'expire'].includes(t.transaction_type))
      .reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;

    const recentActivity = transactions?.slice(0, 10).map(t => ({
      id: t.id,
      type: t.transaction_type,
      points: t.points,
      reason: t.reason,
      date: t.created_at,
      staffUser: t.staff_users && Array.isArray(t.staff_users) && t.staff_users.length > 0 ? 
        `${t.staff_users[0].first_name} ${t.staff_users[0].last_name}` : 
        t.staff_users && !Array.isArray(t.staff_users) ?
        `${(t.staff_users as any).first_name} ${(t.staff_users as any).last_name}` :
        'System',
      expiresAt: t.expires_at
    }));

    return NextResponse.json({
      account: {
        id: account.id,
        userId: account.user_id,
        email: account.email,
        phone: account.phone,
        points: account.points,
        tier: account.tier,
        totalEarned: account.total_earned,
        totalRedeemed: account.total_redeemed,
        createdAt: account.created_at,
        updatedAt: account.updated_at
      },
      transactions: recentActivity,
      summary: {
        currentBalance: account.points,
        totalEarned,
        totalRedeemed,
        totalTransactions: transactions?.length || 0,
        tier: account.tier
      }
    });

  } catch (error) {
    console.error('Loyalty lookup API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Manual points adjustment endpoint
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = params;
    const { points, reason, adjustmentType } = await request.json();

    // Verify staff access
    const authHeader = request.headers.get('authorization');
    let staffUser = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: staff } = await supabase
        .from('staff_users')
        .select('id, username, first_name, last_name, role')
        .eq('id', user.id)
        .single();

      if (!staff || staff.role === 'worker') {
        return NextResponse.json({ error: 'Admin access required for manual adjustments' }, { status: 403 });
      }

      staffUser = staff;
    }

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff authentication required' }, { status: 401 });
    }

    // Validate input
    if (!points || !reason || !adjustmentType) {
      return NextResponse.json({ 
        error: 'Points, reason, and adjustment type are required' 
      }, { status: 400 });
    }

    if (!['earn', 'redeem', 'adjust'].includes(adjustmentType)) {
      return NextResponse.json({ 
        error: 'Invalid adjustment type. Must be earn, redeem, or adjust' 
      }, { status: 400 });
    }

    // Find loyalty account
    const { data: account, error: accountError } = await supabase
      .from('loyalty_accounts')
      .select('id, points')
      .eq('user_id', userId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Loyalty account not found' }, { status: 404 });
    }

    // Calculate final points (negative for redeem)
    const finalPoints = adjustmentType === 'redeem' ? -Math.abs(points) : points;

    // Check if redeem would make balance negative
    if (adjustmentType === 'redeem' && account.points + finalPoints < 0) {
      return NextResponse.json({ 
        error: `Insufficient points. Current balance: ${account.points}` 
      }, { status: 400 });
    }

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('loyalty_transactions')
      .insert({
        loyalty_account_id: account.id,
        transaction_type: adjustmentType,
        points: finalPoints,
        reason: `Manual adjustment: ${reason}`,
        reference_type: 'manual_adjustment',
        staff_user_id: staffUser.id,
        metadata: {
          staff_user: `${staffUser.first_name} ${staffUser.last_name}`,
          adjustment_reason: reason,
          manual_adjustment: true
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating loyalty transaction:', transactionError);
      return NextResponse.json({ error: 'Failed to adjust points' }, { status: 500 });
    }

    // Log staff activity
    await supabase
      .from('staff_activity')
      .insert({
        user_id: staffUser.id,
        user_name: `${staffUser.first_name} ${staffUser.last_name}`,
        action: 'manual_loyalty_adjustment',
        entity_type: 'loyalty_transaction',
        entity_id: transaction.id,
        details: {
          customer_id: userId,
          points: finalPoints,
          reason,
          adjustment_type: adjustmentType
        }
      });

    return NextResponse.json({
      success: true,
      message: `Successfully ${adjustmentType === 'redeem' ? 'deducted' : 'added'} ${Math.abs(finalPoints)} points`,
      transaction: {
        id: transaction.id,
        points: finalPoints,
        reason: transaction.reason,
        createdAt: transaction.created_at
      }
    });

  } catch (error) {
    console.error('Manual loyalty adjustment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
