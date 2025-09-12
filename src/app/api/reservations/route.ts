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
    
    // First, try a simple existence check
    const { data: testData, error: testError } = await supabase
      .from('reservations')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Reservations table access failed:', testError);
      
      // If table doesn't exist, return empty results instead of error
      if (testError.code === 'PGRST116' || testError.message.includes('does not exist')) {
        console.log('ℹ️ Reservations table does not exist, returning empty results');
        return NextResponse.json({
          success: true,
          reservations: [],
          total: 0,
          pagination: {
            offset,
            limit,
            hasMore: false
          },
          message: 'Reservations table not yet created'
        });
      }
      
      return NextResponse.json({ 
        error: 'Reservations table not accessible',
        details: testError.message,
        code: testError.code,
        hint: 'The reservations table may not exist or have permission issues'
      }, { status: 500 });
    }
    
    // If basic access works, try the full query with error handling
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
    console.log('🔍 Creating new reservation...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Configuration error',
        details: 'Missing Supabase credentials'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Create reservation without foreign key constraints
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
        created_by_name: 'Online System' // Use string instead of foreign key
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating reservation:', createError);
      
      // Handle table not existing gracefully
      if (createError.code === 'PGRST116' || createError.message.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Reservations system not available',
          details: 'Reservations table not yet created',
          code: createError.code
        }, { status: 503 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to create reservation',
        details: createError.message,
        code: createError.code
      }, { status: 500 });
    }

    console.log('✅ Reservation created successfully:', reservation.id);

    // Skip staff activity logging since staff_activity table may not exist
    // This can be re-enabled once proper staff management is set up

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
