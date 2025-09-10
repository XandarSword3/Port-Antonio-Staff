import { NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

function getClient() {
  return supabaseAdmin ?? supabase
}

export async function GET() {
  try {
    const client = getClient()
    if (!client) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayISO = todayStart.toISOString()

    // Reservations (if a reservations table exists; otherwise 0)
    let todayReservations = 0
    try {
      const { count } = await client
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO)
      todayReservations = count || 0
    } catch {}

    // Pending orders count
    let pendingOrders = 0
    try {
      const { count } = await client
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'preparing'])
      pendingOrders = count || 0
    } catch {}

    // Completed orders today and average order time placeholder
    let completedOrders = 0
    try {
      const { count } = await client
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'served')
        .gte('created_at', todayISO)
      completedOrders = count || 0
    } catch {}

    // Revenue today (sum of total)
    let totalRevenue = 0
    try {
      const { data, error } = await client
        .from('orders')
        .select('total, created_at')
        .gte('created_at', todayISO)
      if (error) throw error
      totalRevenue = (data || []).reduce((sum: number, o: any) => sum + (o.total || 0), 0)
    } catch {}

    // Active staff placeholder (depends on staff presence table/session)
    const activeStaff = 0

    // Avg order time placeholder (no timestamps to compute reliably here)
    const avgOrderTime = 0

    return NextResponse.json({
      todayReservations,
      pendingOrders,
      totalRevenue,
      activeStaff,
      completedOrders,
      avgOrderTime,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to compute metrics' }, { status: 500 })
  }
}


