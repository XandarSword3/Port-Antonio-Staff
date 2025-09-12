import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Get auth header or use session from cookies
    const authHeader = request.headers.get('authorization');
    let staffUser = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        const { data: staff } = await supabase
          .from('staff_users')
          .select('id, role')
          .eq('id', user.id)
          .eq('is_active', true)
          .single();
        
        staffUser = staff;
      }
    }

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff authentication required' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
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
        staff_users!created_by (
          username,
          first_name,
          last_name
        )
      `)
      .order('reservation_date', { ascending: false })
      .order('reservation_time', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: reservations, error: reservationsError } = await query;

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError);
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
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
      createdByName: reservation.staff_users && !Array.isArray(reservation.staff_users) ? 
        `${(reservation.staff_users as any).first_name} ${(reservation.staff_users as any).last_name}` : 
        'Unknown',
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

  } catch (error) {
    console.error('Reservations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Get auth header
    const authHeader = request.headers.get('authorization');
    let staffUser = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        const { data: staff } = await supabase
          .from('staff_users')
          .select('id, username, first_name, last_name, role')
          .eq('id', user.id)
          .eq('is_active', true)
          .single();
        
        staffUser = staff;
      }
    }

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff authentication required' }, { status: 401 });
    }

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
        created_by: staffUser.id
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating reservation:', createError);
      return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
    }

    // Log staff activity
    await supabase
      .from('staff_activity')
      .insert({
        user_id: staffUser.id,
        user_name: `${staffUser.first_name} ${staffUser.last_name}`,
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
        createdByName: `${staffUser.first_name} ${staffUser.last_name}`
      }
    });

  } catch (error) {
    console.error('Create reservation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
