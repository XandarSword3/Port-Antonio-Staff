import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-webhook-signature');
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const body = await request.text();
    
    // Verify signature (implement proper HMAC verification in production)
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
    }

    const reservationData = JSON.parse(body);

    // Validate required fields
    const requiredFields = ['customer_name', 'customer_email', 'party_size', 'reservation_date', 'reservation_time'];
    for (const field of requiredFields) {
      if (!reservationData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    // Create reservation in database
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        customer_name: reservationData.customer_name,
        customer_email: reservationData.customer_email,
        customer_phone: reservationData.customer_phone || null,
        party_size: reservationData.party_size,
        reservation_date: reservationData.reservation_date,
        reservation_time: reservationData.reservation_time,
        special_requests: reservationData.special_requests || null,
        status: 'confirmed',
        source: 'website',
        table_number: null, // To be assigned by staff
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reservation:', error);
      return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
    }

    // Create notification for staff
    await supabase
      .from('notifications')
      .insert({
        type: 'info',
        title: 'New Website Reservation',
        message: `New reservation for ${reservationData.customer_name} on ${reservationData.reservation_date} at ${reservationData.reservation_time}`,
        metadata: {
          reservation_id: data.id,
          party_size: reservationData.party_size,
          source: 'website'
        }
      });

    return NextResponse.json({ 
      success: true, 
      reservation_id: data.id,
      message: 'Reservation created successfully' 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
