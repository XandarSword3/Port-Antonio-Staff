import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { tableNumber } = await request.json();

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

    // Get current reservation to check status
    const { data: currentReservation } = await supabase
      .from('reservations')
      .select('status')
      .eq('id', id)
      .single();

    if (!currentReservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Update reservation status and table number
    const updateData: any = { 
      status: 'arrived',
      updated_at: new Date().toISOString()
    };

    if (tableNumber) {
      updateData.table_number = tableNumber;
    }

    const { data: reservation, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error marking reservation as arrived:', updateError);
      return NextResponse.json({ error: 'Failed to mark reservation as arrived' }, { status: 500 });
    }

    // Log staff activity
    await supabase
      .from('staff_activity')
      .insert({
        user_id: staffUser.id,
        user_name: `${staffUser.first_name} ${staffUser.last_name}`,
        action: 'mark_reservation_arrived',
        entity_type: 'reservation',
        entity_id: reservation.id,
        details: {
          customer_name: reservation.customer_name,
          reservation_date: reservation.reservation_date,
          reservation_time: reservation.reservation_time,
          table_number: tableNumber || reservation.table_number,
          previous_status: currentReservation.status,
          new_status: 'arrived'
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Customer marked as arrived',
      reservation: {
        id: reservation.id,
        status: reservation.status,
        tableNumber: reservation.table_number,
        updatedAt: reservation.updated_at
      }
    });

  } catch (error) {
    console.error('Mark arrived API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
