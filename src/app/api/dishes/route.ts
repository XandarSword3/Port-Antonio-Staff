import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const client = supabase ?? supabaseAdmin
    if (!client) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    const { data, error } = await client
      .from('dishes')
      .select('*')
      .order('name')

    if (error) throw error
    return NextResponse.json({ dishes: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load dishes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
    }
    const body = await req.json()
    const { data, error } = await supabaseAdmin
      .from('dishes')
      .insert([body])
      .select('*')

    if (error) throw error
    return NextResponse.json({ dish: data?.[0] ?? null })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create dish' }, { status: 500 })
  }
}


