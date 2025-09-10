import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export async function GET() {
  const client = supabaseAdmin ?? supabase
  if (!client) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  const { data, error } = await client.from('jobs').select('*').order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs: data || [] })
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('jobs').insert(body).select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data?.[0] || null })
}

export async function PUT(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  const body = await req.json()
  const { id, ...rest } = body
  const { data, error } = await supabaseAdmin.from('jobs').update(rest).eq('id', id).select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data?.[0] || null })
}

export async function DELETE(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await supabaseAdmin.from('jobs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}


