import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const client = supabaseAdmin ?? supabase
    if (!client) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return NextResponse.json({ orders: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load orders' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const client = supabaseAdmin ?? supabase
    if (!client) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('id')
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // First delete order items (due to foreign key constraint)
    const { error: itemsError } = await client
      .from('order_items')
      .delete()
      .eq('order_id', orderId)

    if (itemsError) throw itemsError

    // Then delete the order
    const { error: orderError } = await client
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (orderError) throw orderError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete order' }, { status: 500 })
  }
}


