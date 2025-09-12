import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { reason, notifyCustomer = false } = await request.json();

    // Verify staff access
    const authHeader = request.headers.get('authorization');
    let staffUser = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: staff } = await supabase
        .from('staff_users')
        .select('id, username, first_name, last_name, role')
        .eq('id', user.id)
        .eq('is_active', true)
        .single();

      if (!staff) {
        return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
      }

      staffUser = staff;
    }

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff authentication required' }, { status: 401 });
    }

    // Get current reservation details
    const { data: currentReservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (reservationError || !currentReservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (currentReservation.status === 'cancelled') {
      return NextResponse.json({ error: 'Reservation is already cancelled' }, { status: 400 });
    }

    // Update reservation status to cancelled
    const { data: reservation, error: updateError } = await supabase
      .from('reservations')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        special_requests: currentReservation.special_requests ? 
          `${currentReservation.special_requests}\n\nCancellation reason: ${reason || 'No reason provided'}` :
          `Cancellation reason: ${reason || 'No reason provided'}`
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error cancelling reservation:', updateError);
      return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 });
    }

    // Log staff activity
    await supabase
      .from('staff_activity')
      .insert({
        user_id: staffUser.id,
        user_name: `${staffUser.first_name} ${staffUser.last_name}`,
        action: 'cancel_reservation',
        entity_type: 'reservation',
        entity_id: reservation.id,
        details: {
          customer_name: reservation.customer_name,
          customer_email: reservation.customer_email,
          reservation_date: reservation.reservation_date,
          reservation_time: reservation.reservation_time,
          party_size: reservation.party_size,
          previous_status: currentReservation.status,
          new_status: 'cancelled',
          cancellation_reason: reason,
          notify_customer: notifyCustomer
        }
      });

    // TODO: Send cancellation notification to customer if requested
    // This would integrate with email/SMS service
    if (notifyCustomer && currentReservation.customer_email) {
      // Implementation would go here for sending cancellation email
      console.log(`Would send cancellation email to ${currentReservation.customer_email}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Reservation cancelled successfully',
      reservation: {
        id: reservation.id,
        status: reservation.status,
        updatedAt: reservation.updated_at
      }
    });

  } catch (error) {
    console.error('Cancel reservation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
