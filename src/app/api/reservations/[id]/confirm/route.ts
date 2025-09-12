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

    // Update reservation status
    const { data: reservation, error: updateError } = await supabase
      .from('reservations')
      .update({ 
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error confirming reservation:', updateError);
      return NextResponse.json({ error: 'Failed to confirm reservation' }, { status: 500 });
    }

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Log staff activity
    await supabase
      .from('staff_activity')
      .insert({
        user_id: staffUser.id,
        user_name: `${staffUser.first_name} ${staffUser.last_name}`,
        action: 'confirm_reservation',
        entity_type: 'reservation',
        entity_id: reservation.id,
        details: {
          customer_name: reservation.customer_name,
          reservation_date: reservation.reservation_date,
          reservation_time: reservation.reservation_time,
          previous_status: 'pending',
          new_status: 'confirmed'
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Reservation confirmed successfully',
      reservation: {
        id: reservation.id,
        status: reservation.status,
        updatedAt: reservation.updated_at
      }
    });

  } catch (error) {
    console.error('Confirm reservation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
