import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CUSTOMER_BASE = 'https://port-san-antonio.vercel.app'

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
    const { type } = await req.json() as { type: 'privacy' | 'terms' | 'accessibility' }
    if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 })

    const srcUrl = `${CUSTOMER_BASE}/api/legal?type=${encodeURIComponent(type)}`
    const res = await fetch(srcUrl, { cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: `Failed to fetch customer ${type}` }, { status: 502 })
    const json = await res.json()
    const page = (json.legalPages && json.legalPages[0]) || null
    if (!page) return NextResponse.json({ error: 'No source page found' }, { status: 404 })

    const title: string = page.title || type[0].toUpperCase() + type.slice(1)
    const sections = Array.isArray(page.sections) ? page.sections : []

    const { data, error } = await supabaseAdmin
      .from('legal_pages')
      .upsert({ type, title, sections }, { onConflict: 'type' })
      .select('*')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ legalPage: data?.[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Import failed' }, { status: 500 })
  }
}


