import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Add sample orders
    const sampleOrders = [
      {
        order_number: 'ORD-001',
        customer_name: 'John Smith',
        customer_email: 'john@example.com',
        customer_phone: '555-0101',
        table_number: '5',
        subtotal: 45.50,
        tax: 3.64,
        tip: 9.10,
        total: 58.24,
        payment_method: 'card',
        payment_status: 'paid',
        status: 'served',
        special_instructions: 'No onions on the burger',
        created_by: 'system',
        created_by_name: 'System',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        order_number: 'ORD-002',
        customer_name: 'Sarah Johnson',
        customer_email: 'sarah@example.com',
        customer_phone: '555-0102',
        table_number: '12',
        subtotal: 32.75,
        tax: 2.62,
        tip: 6.55,
        total: 41.92,
        payment_method: 'cash',
        payment_status: 'paid',
        status: 'preparing',
        special_instructions: 'Extra spicy',
        created_by: 'system',
        created_by_name: 'System',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        order_number: 'ORD-003',
        customer_name: 'Mike Davis',
        customer_email: 'mike@example.com',
        customer_phone: '555-0103',
        table_number: '8',
        subtotal: 28.00,
        tax: 2.24,
        tip: 5.60,
        total: 35.84,
        payment_method: 'stripe',
        payment_status: 'paid',
        status: 'pending',
        special_instructions: 'Well done steak',
        created_by: 'system',
        created_by_name: 'System',
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      }
    ];

    // Add sample reservations
    const sampleReservations = [
      {
        customer_name: 'Alice Brown',
        customer_email: 'alice@example.com',
        customer_phone: '555-0201',
        party_size: 4,
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '19:00',
        table_number: '15',
        special_requests: 'Anniversary dinner',
        status: 'confirmed',
        created_by: 'system',
        created_by_name: 'System',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        customer_name: 'Robert Wilson',
        customer_email: 'robert@example.com',
        customer_phone: '555-0202',
        party_size: 2,
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '20:30',
        table_number: '7',
        special_requests: 'Window table preferred',
        status: 'pending',
        created_by: 'system',
        created_by_name: 'System',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Insert sample orders
    const { error: ordersError } = await supabaseAdmin
      .from('orders')
      .insert(sampleOrders);

    if (ordersError) throw ordersError;

    // Insert sample reservations
    const { error: reservationsError } = await supabaseAdmin
      .from('reservations')
      .insert(sampleReservations);

    if (reservationsError) throw reservationsError;

    return NextResponse.json({ success: true, message: 'Sample data added successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to add sample data' }, { status: 500 })
  }
}
