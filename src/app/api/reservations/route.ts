import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Reservations API - Starting request');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      return NextResponse.json({ 
        error: 'Configuration error',
        details: 'Missing Supabase credentials'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    console.log('🔍 Building reservations query...');
    let query = supabase
      .from('reservations')
      .select(`
        id,
        customer_name,
        customer_email,
        customer_phone,
        party_size,
        reservation_date,
        reservation_time,
        table_number,
        special_requests,
        status,
        created_at,
        updated_at,
        created_by,
        created_by_name
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    console.log('🔍 Executing reservations query...');
    
    // First, try a simple count to test if the table exists
    const { data: testData, error: testError } = await supabase
      .from('reservations')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Reservations table access failed:', testError);
      return NextResponse.json({ 
        error: 'Reservations table not accessible',
        details: testError.message,
        code: testError.code,
        hint: 'The reservations table may not exist or have permission issues'
      }, { status: 500 });
    }
    
    // If basic access works, try the full query
    const { data: reservations, error: reservationsError } = await query;

    if (reservationsError) {
      console.error('❌ Error fetching reservations:', reservationsError);
      return NextResponse.json({ 
        error: 'Failed to fetch reservations',
        details: reservationsError.message,
        code: reservationsError.code
      }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedReservations = reservations?.map(reservation => ({
      id: reservation.id,
      customerName: reservation.customer_name,
      customerEmail: reservation.customer_email,
      customerPhone: reservation.customer_phone,
      partySize: reservation.party_size,
      date: reservation.reservation_date,
      time: reservation.reservation_time,
      tableNumber: reservation.table_number,
      specialRequests: reservation.special_requests,
      status: reservation.status,
      createdAt: reservation.created_at,
      updatedAt: reservation.updated_at,
      createdBy: reservation.created_by,
      createdByName: reservation.created_by_name || 'Unknown',
      visibleTo: [] // This would be populated based on your business logic
    })) || [];

    return NextResponse.json({
      success: true,
      reservations: transformedReservations,
      total: transformedReservations.length,
      pagination: {
        offset,
        limit,
        hasMore: transformedReservations.length === limit
      }
    });

  } catch (error: any) {
    console.error('❌ Reservations API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      customerName,
      customerEmail,
      customerPhone,
      partySize,
      date,
      time,
      tableNumber,
      specialRequests
    } = await request.json();

    // Validate required fields
    if (!customerName || !partySize || !date || !time) {
      return NextResponse.json({ 
        error: 'Missing required fields: customerName, partySize, date, time' 
      }, { status: 400 });
    }

    // Create reservation
    const { data: reservation, error: createError } = await supabase
      .from('reservations')
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        party_size: parseInt(partySize),
        reservation_date: date,
        reservation_time: time,
        table_number: tableNumber,
        special_requests: specialRequests,
        status: 'pending',
        created_by: null // Will be set by RLS or trigger if needed
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating reservation:', createError);
      return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
    }

    // Log staff activity (optional - skip if no staff user context)
    try {
      await supabase
        .from('staff_activity')
        .insert({
          user_id: null,
          user_name: 'System',
          action: 'create_reservation',
          entity_type: 'reservation',
          entity_id: reservation.id,
          details: {
            customer_name: customerName,
            party_size: partySize,
            reservation_date: date,
            reservation_time: time
          }
        });
    } catch (activityError) {
      // Log activity error but don't fail the request
      console.warn('Failed to log staff activity:', activityError);
    }

    return NextResponse.json({
      success: true,
      message: 'Reservation created successfully',
      reservation: {
        id: reservation.id,
        customerName: reservation.customer_name,
        customerEmail: reservation.customer_email,
        customerPhone: reservation.customer_phone,
        partySize: reservation.party_size,
        date: reservation.reservation_date,
        time: reservation.reservation_time,
        tableNumber: reservation.table_number,
        specialRequests: reservation.special_requests,
        status: reservation.status,
        createdAt: reservation.created_at,
        createdBy: reservation.created_by,
        createdByName: 'System'
      }
    });

  } catch (error) {
    console.error('Create reservation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
