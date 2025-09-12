import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { events, visitorId, visitorMeta } = await request.json();

    if (!events || !Array.isArray(events) || !visitorId) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Upsert visitor information
    if (visitorMeta) {
      await supabase
        .from('visitors')
        .upsert({
          visitor_id: visitorId,
          last_seen: new Date().toISOString(),
          device_meta: visitorMeta,
          // Only set first_seen on first upsert
          first_seen: new Date().toISOString()
        }, {
          onConflict: 'visitor_id',
          ignoreDuplicates: false
        });
    }

    // Insert analytics events
    if (events.length > 0) {
      const analyticsEvents = events.map((event: any) => ({
        visitor_id: visitorId,
        event_name: event.event_name,
        event_props: event.event_props || {},
        url: event.url,
        referrer: event.referrer,
        created_at: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString()
      }));

      const { error: eventsError } = await supabase
        .from('analytics_events')
        .insert(analyticsEvents);

      if (eventsError) {
        console.error('Error inserting analytics events:', eventsError);
        return NextResponse.json(
          { error: 'Failed to save events' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      eventsProcessed: events.length 
    });

  } catch (error) {
    console.error('Analytics batch API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
