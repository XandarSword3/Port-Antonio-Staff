import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, email, phone, points, reason, referenceType, referenceId, metadata } = await request.json();

    // Validate required fields
    if (!points || !reason) {
      return NextResponse.json({ error: 'Points and reason are required' }, { status: 400 });
    }

    if (!userId && !email && !phone) {
      return NextResponse.json({ error: 'User identifier required (userId, email, or phone)' }, { status: 400 });
    }

    // Get current session to verify staff user
    const authHeader = request.headers.get('authorization');
    let staffUserId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        const { data: staffUser } = await supabase
          .from('staff_users')
          .select('id')
          .eq('id', user.id)
          .single();
        
        staffUserId = staffUser?.id;
      }
    }

    // Start a database transaction
    const { data: transactionResult, error: transactionError } = await supabase.rpc(
      'award_loyalty_points',
      {
        p_user_id: userId || null,
        p_email: email || null,
        p_phone: phone || null,
        p_points: points,
        p_reason: reason,
        p_reference_type: referenceType || null,
        p_reference_id: referenceId || null,
        p_staff_user_id: staffUserId,
        p_metadata: metadata || {}
      }
    );

    if (transactionError) {
      console.error('Error awarding loyalty points:', transactionError);
      return NextResponse.json({ error: 'Failed to award points' }, { status: 500 });
    }

    // Log staff activity
    if (staffUserId) {
      await supabase
        .from('staff_activity')
        .insert({
          user_id: staffUserId,
          user_name: 'Staff User', // TODO: Get actual name
          action: 'award_loyalty_points',
          entity_type: 'loyalty_transaction',
          entity_id: transactionResult?.transaction_id || 'unknown',
          details: {
            points,
            reason,
            customer_identifier: userId || email || phone,
            reference_type: referenceType,
            reference_id: referenceId
          }
        });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully awarded ${points} points`,
      transactionId: transactionResult?.transaction_id,
      accountId: transactionResult?.account_id,
      newBalance: transactionResult?.new_balance
    });

  } catch (error) {
    console.error('Loyalty award API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create the stored procedure if it doesn't exist
export async function GET() {
  try {
    // This endpoint creates the stored procedure for awarding loyalty points
    const procedureSQL = `
      CREATE OR REPLACE FUNCTION award_loyalty_points(
        p_user_id UUID DEFAULT NULL,
        p_email VARCHAR(255) DEFAULT NULL,
        p_phone VARCHAR(20) DEFAULT NULL,
        p_points INTEGER,
        p_reason VARCHAR(255),
        p_reference_type VARCHAR(50) DEFAULT NULL,
        p_reference_id UUID DEFAULT NULL,
        p_staff_user_id UUID DEFAULT NULL,
        p_metadata JSONB DEFAULT '{}'
      ) RETURNS JSON AS $$
      DECLARE
        account_id UUID;
        transaction_id UUID;
        new_balance INTEGER;
        result JSON;
      BEGIN
        -- Find or create loyalty account
        SELECT id INTO account_id 
        FROM loyalty_accounts 
        WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
           OR (p_email IS NOT NULL AND email = p_email)
           OR (p_phone IS NOT NULL AND phone = p_phone)
        LIMIT 1;
        
        -- Create account if it doesn't exist
        IF account_id IS NULL THEN
          INSERT INTO loyalty_accounts (user_id, email, phone)
          VALUES (p_user_id, p_email, p_phone)
          RETURNING id INTO account_id;
        END IF;
        
        -- Insert the transaction (triggers will update the account automatically)
        INSERT INTO loyalty_transactions (
          loyalty_account_id,
          transaction_type,
          points,
          reason,
          reference_type,
          reference_id,
          staff_user_id,
          metadata
        ) VALUES (
          account_id,
          'earn',
          p_points,
          p_reason,
          p_reference_type,
          p_reference_id,
          p_staff_user_id,
          p_metadata
        ) RETURNING id INTO transaction_id;
        
        -- Get updated balance
        SELECT points INTO new_balance 
        FROM loyalty_accounts 
        WHERE id = account_id;
        
        -- Return result
        result := json_build_object(
          'transaction_id', transaction_id,
          'account_id', account_id,
          'new_balance', new_balance
        );
        
        RETURN result;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: procedureSQL });
    
    if (error) {
      console.error('Error creating stored procedure:', error);
      return NextResponse.json({ error: 'Failed to setup loyalty system' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Loyalty award system initialized' });

  } catch (error) {
    console.error('Loyalty setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
