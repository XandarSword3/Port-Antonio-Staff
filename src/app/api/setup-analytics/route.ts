// Test script to create analytics tables and test data
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('🔧 Creating analytics tables...');

    // Try to create analytics_events table
    const createAnalyticsEventsSQL = `
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        page_url TEXT,
        visitor_id UUID,
        session_id UUID,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Try to create visitors table  
    const createVisitorsSQL = `
      CREATE TABLE IF NOT EXISTS visitors (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        first_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        visit_count INTEGER DEFAULT 1,
        user_agent TEXT,
        ip_address INET,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Try to create user_visitors table
    const createUserVisitorsSQL = `
      CREATE TABLE IF NOT EXISTS user_visitors (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        visitor_id UUID REFERENCES visitors(id),
        user_id UUID,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Execute SQL using RPC (if available)
    try {
      await supabase.rpc('exec_sql', { sql: createAnalyticsEventsSQL });
      await supabase.rpc('exec_sql', { sql: createVisitorsSQL });
      await supabase.rpc('exec_sql', { sql: createUserVisitorsSQL });
    } catch (error) {
      console.log('RPC method not available, trying direct table operations...');
    }

    // Test inserting sample data
    const visitorId = crypto.randomUUID();
    
    // Insert test visitor
    const { error: visitorError } = await supabase
      .from('visitors')
      .insert({
        id: visitorId,
        first_visit: new Date().toISOString(),
        user_agent: 'Test Analytics Bot'
      });

    if (visitorError) {
      console.log('❌ Could not insert visitor:', visitorError);
    } else {
      console.log('✅ Visitor inserted successfully');
    }

    // Insert test analytics events
    const { error: eventError } = await supabase
      .from('analytics_events')
      .insert([
        {
          event_type: 'page_view',
          page_url: '/',
          visitor_id: visitorId,
          metadata: { title: 'Homepage' }
        },
        {
          event_type: 'page_view', 
          page_url: '/menu',
          visitor_id: visitorId,
          metadata: { title: 'Menu Page' }
        },
        {
          event_type: 'click',
          page_url: '/menu',
          visitor_id: visitorId,
          metadata: { selector: '.reservation-button', element: 'Reserve Table' }
        }
      ]);

    if (eventError) {
      console.log('❌ Could not insert analytics events:', eventError);
    } else {
      console.log('✅ Analytics events inserted successfully');
    }

    // Test querying the data
    const { data: visitors, error: visitorsQueryError } = await supabase
      .from('visitors')
      .select('*')
      .limit(5);

    const { data: events, error: eventsQueryError } = await supabase
      .from('analytics_events')
      .select('*')
      .limit(5);

    return NextResponse.json({
      success: true,
      message: 'Analytics tables setup and tested',
      results: {
        visitors: {
          error: visitorsQueryError?.message,
          count: visitors?.length || 0,
          sample: visitors?.[0]
        },
        events: {
          error: eventsQueryError?.message,
          count: events?.length || 0,
          sample: events?.[0]
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Analytics setup error:', error);
    return NextResponse.json({ 
      error: 'Analytics setup failed',
      details: error.message
    }, { status: 500 });
  }
}
