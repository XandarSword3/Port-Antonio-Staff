import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAnalyticsMetrics } from '../../../../lib/analytics.server';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Fetch analytics metrics (each function creates its own Supabase client)
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
    const { days = 30 } = await request.json();

    // Fetch analytics metrics (each function creates its own Supabase client)
    const metrics = await getAnalyticsMetrics(days);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
