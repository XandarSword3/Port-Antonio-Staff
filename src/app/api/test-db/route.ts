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
    console.log('Testing basic connection...');
    
    // Check what tables actually exist
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec', { 
        sql: `SELECT table_name FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name IN ('users', 'staff_users', 'reservations', 'analytics_events', 'visitors');`
      })
      .select();

    if (tablesError) {
      console.log('Using alternative method to check tables...');
      // Alternative: try to query each table directly
      const tableChecks: any = {};
      
      const tablesToCheck = ['users', 'staff_users', 'reservations', 'analytics_events', 'visitors'];
      
      for (const tableName of tablesToCheck) {
        try {
          const { data, error } = await supabase.from(tableName).select('*').limit(1);
          tableChecks[tableName] = { 
            exists: !error, 
            error: error?.message,
            count: data?.length || 0 
          };
        } catch (e: any) {
          tableChecks[tableName] = { exists: false, error: e.message };
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Table check completed',
        method: 'direct_query',
        tables: tableChecks
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful using RPC',
      method: 'rpc_query',
      tables: tables
    });

  } catch (error: any) {
    console.error('Test API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
