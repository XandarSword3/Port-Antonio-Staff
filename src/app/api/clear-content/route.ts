import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
    }
    let scope: 'all' | 'legal' | 'footer' = 'all'
    try {
      const body = await req.json()
      if (body && (body.scope === 'legal' || body.scope === 'footer' || body.scope === 'all')) {
        scope = body.scope
      }
    } catch {}

    if (scope === 'all' || scope === 'legal') {
      // Clear all legal pages
      const { error: legalError } = await supabaseAdmin
        .from('legal_pages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (legalError) throw legalError
    }

    if (scope === 'all' || scope === 'footer') {
      // Clear footer settings
      const { error: footerError } = await supabaseAdmin
        .from('footer_settings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (footerError) throw footerError
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Requested content cleared from database.' 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to clear content' }, { status: 500 })
  }
}
