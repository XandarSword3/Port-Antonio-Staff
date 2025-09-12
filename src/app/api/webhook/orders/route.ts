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

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    const body = await request.text();
    
    // Verify signature (implement proper HMAC verification in production)
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
    }

    const orderData = JSON.parse(body);

    // Validate required fields
    const requiredFields = ['order_number', 'customer_name', 'customer_email', 'items', 'total'];
    for (const field of requiredFields) {
      if (!orderData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderData.order_number,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone || null,
        order_type: orderData.order_type || 'takeout',
        delivery_address: orderData.delivery_address || null,
        status: 'pending',
        subtotal: orderData.subtotal || 0,
        tax_amount: orderData.tax || 0,
        delivery_fee: orderData.delivery_fee || 0,
        total_amount: orderData.total,
        payment_status: orderData.payment_status || 'pending',
        source: 'website',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    const orderItems = orderData.items.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id || null,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      special_instructions: item.special_instructions || null,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Don't fail the whole order, but log the error
    }

    // Create kitchen ticket
    const { error: ticketError } = await supabase
      .from('kitchen_tickets')
      .insert({
        order_id: order.id,
        order_number: orderData.order_number,
        customer_name: orderData.customer_name,
        items: orderData.items,
        status: 'pending',
        priority: 'normal',
        special_instructions: orderData.items
          .map((item: any) => item.special_instructions)
          .filter(Boolean)
          .join('; ') || null,
      });

    if (ticketError) {
      console.error('Error creating kitchen ticket:', ticketError);
    }

    // Create notification for staff
    await supabase
      .from('notifications')
      .insert({
        type: 'info',
        title: 'New Website Order',
        message: `New ${orderData.order_type || 'takeout'} order ${orderData.order_number} from ${orderData.customer_name}`,
        metadata: {
          order_id: order.id,
          order_number: orderData.order_number,
          total: orderData.total,
          source: 'website'
        }
      });

    return NextResponse.json({ 
      success: true, 
      order_id: order.id,
      message: 'Order created successfully' 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
