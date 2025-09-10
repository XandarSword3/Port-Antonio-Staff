import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const client = supabaseAdmin ?? supabase
  if (!client) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const query = client.from('legal_pages').select('*')
  if (type) (query as any).eq('type', type)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pages: data || [] })
}

export async function PUT(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('legal_pages').upsert(body).select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ page: data?.[0] || null })
}


