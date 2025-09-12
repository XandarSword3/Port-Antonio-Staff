import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { loyaltyPoints = 200 } = await request.json(); // Default 200 points per completed reservation

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

    // Update reservation status to completed
    const { data: reservation, error: updateError } = await supabase
      .from('reservations')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error completing reservation:', updateError);
      return NextResponse.json({ error: 'Failed to complete reservation' }, { status: 500 });
    }

    // Award loyalty points if customer has email or phone
    let loyaltyResult = null;
    if (currentReservation.customer_email || currentReservation.customer_phone) {
      try {
        const loyaltyResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/loyalty/award`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authHeader?.replace('Bearer ', '') || ''}`
          },
          body: JSON.stringify({
            email: currentReservation.customer_email,
            phone: currentReservation.customer_phone,
            points: loyaltyPoints,
            reason: 'Completed reservation',
            referenceType: 'reservation',
            referenceId: reservation.id,
            metadata: {
              customer_name: currentReservation.customer_name,
              reservation_date: currentReservation.reservation_date,
              reservation_time: currentReservation.reservation_time,
              party_size: currentReservation.party_size
            }
          })
        });

        if (loyaltyResponse.ok) {
          loyaltyResult = await loyaltyResponse.json();
        }
      } catch (loyaltyError) {
        console.warn('Failed to award loyalty points:', loyaltyError);
        // Continue without failing the reservation completion
      }
    }

    // Log staff activity
    await supabase
      .from('staff_activity')
      .insert({
        user_id: staffUser.id,
        user_name: `${staffUser.first_name} ${staffUser.last_name}`,
        action: 'complete_reservation',
        entity_type: 'reservation',
        entity_id: reservation.id,
        details: {
          customer_name: reservation.customer_name,
          customer_email: reservation.customer_email,
          reservation_date: reservation.reservation_date,
          reservation_time: reservation.reservation_time,
          party_size: reservation.party_size,
          previous_status: currentReservation.status,
          new_status: 'completed',
          loyalty_points_awarded: loyaltyResult ? loyaltyPoints : 0,
          loyalty_success: !!loyaltyResult
        }
      });

    const response: any = {
      success: true,
      message: 'Reservation completed successfully',
      reservation: {
        id: reservation.id,
        status: reservation.status,
        updatedAt: reservation.updated_at
      }
    };

    if (loyaltyResult) {
      response.loyalty = {
        pointsAwarded: loyaltyPoints,
        newBalance: loyaltyResult.newBalance,
        message: loyaltyResult.message
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Complete reservation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
