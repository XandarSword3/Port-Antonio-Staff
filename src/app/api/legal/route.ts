import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export async function GET() {
  const client = supabaseAdmin ?? supabase
  if (!client) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  const { data, error } = await client
    .from('legal_pages')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ legalPages: data || [] })
}

export async function PUT(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'No admin client' }, { status: 500 })
  const body = await req.json() as {
    type: 'privacy' | 'terms' | 'accessibility'
    title: string
    sections: Array<{ id: string; title: string; content: string; order: number }>
  }
  const { data, error } = await supabaseAdmin
    .from('legal_pages')
    .upsert({ type: body.type, title: body.title, sections: body.sections }, { onConflict: 'type' })
    .select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ legalPage: data?.[0] ?? null })
}


