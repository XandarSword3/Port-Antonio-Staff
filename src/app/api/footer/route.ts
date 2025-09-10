import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export async function GET() {
  const client = supabaseAdmin ?? supabase
  if (!client) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  const { data, error } = await client.from('footer_settings').select('*').order('updated_at', { ascending: false }).limit(1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ footer: data?.[0] || null })
}

export async function PUT(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  const body = await req.json()
  // Upsert single row
  const { data, error } = await supabaseAdmin.from('footer_settings').upsert({ ...body }).select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ footer: data?.[0] || null })
}


