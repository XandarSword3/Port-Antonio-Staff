import { NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const client = supabase ?? supabaseAdmin
    if (!client) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    const { data, error } = await client
      .from('categories')
      .select('*')
      .order('order_index')

    if (error) throw error
    return NextResponse.json({ categories: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load categories' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
    }
    const body = await req.json()
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([body])
      .select('*')

    if (error) throw error
    return NextResponse.json({ category: data?.[0] ?? null })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create category' }, { status: 500 })
  }
}


