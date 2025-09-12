import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAnalyticsMetrics } from '../../../../lib/analytics.server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the session token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is staff with analytics access
    const { data: staffUser, error: staffError } = await supabase
      .from('staff_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (staffError || !staffUser || (staffUser.role !== 'admin' && staffUser.role !== 'owner')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Fetch analytics metrics
    const metrics = await getAnalyticsMetrics(days);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Alternative endpoint for staff portal direct access (no auth header needed, uses cookies)
export async function POST(request: NextRequest) {
  try {
    // This endpoint can be called directly from the staff portal
    // It will use the session cookies for authentication
    
    const { days = 30 } = await request.json();

    // Get session from cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is staff with analytics access
    const { data: staffUser, error: staffError } = await supabase
      .from('staff_users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (staffError || !staffUser || (staffUser.role !== 'admin' && staffUser.role !== 'owner')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch analytics metrics
    const metrics = await getAnalyticsMetrics(days);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
