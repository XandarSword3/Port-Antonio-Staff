// Simple test API endpoint to check database connection
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🔍 Testing database connection...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment check:');
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('Service Key:', supabaseServiceKey ? 'Set' : 'Missing');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        supabaseUrl: !!supabaseUrl,
        serviceKey: !!supabaseServiceKey
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('reservations')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Database connection error:', testError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: testError
      }, { status: 500 });
    }

    // Check different tables
    const tableChecks: any = {};
    
    // Reservations
    try {
      const { data, error } = await supabase.from('reservations').select('*').limit(1);
      tableChecks.reservations = { exists: !error, count: data?.length || 0, error: error?.message };
    } catch (e: any) {
      tableChecks.reservations = { exists: false, error: e.message };
    }

    // Analytics events
    try {
      const { data, error } = await supabase.from('analytics_events').select('*').limit(1);
      tableChecks.analytics_events = { exists: !error, count: data?.length || 0, error: error?.message };
    } catch (e: any) {
      tableChecks.analytics_events = { exists: false, error: e.message };
    }

    // Visitors
    try {
      const { data, error } = await supabase.from('visitors').select('*').limit(1);
      tableChecks.visitors = { exists: !error, count: data?.length || 0, error: error?.message };
    } catch (e: any) {
      tableChecks.visitors = { exists: false, error: e.message };
    }

    // Staff users
    try {
      const { data, error } = await supabase.from('staff_users').select('*').limit(1);
      tableChecks.staff_users = { exists: !error, count: data?.length || 0, error: error?.message };
    } catch (e: any) {
      tableChecks.staff_users = { exists: false, error: e.message };
    }

    console.log('Table checks:', tableChecks);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      tables: tableChecks
    });

  } catch (error: any) {
    console.error('Test API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
