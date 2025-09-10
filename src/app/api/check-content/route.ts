import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Check what's in the database
    const { data: footerData, error: footerError } = await supabaseAdmin
      .from('footer_settings')
      .select('*')
      .limit(1);

    const { data: legalData, error: legalError } = await supabaseAdmin
      .from('legal_pages')
      .select('*')
      .order('type');

    const { data: eventsData, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('*')
      .limit(5);

    return NextResponse.json({
      footer: footerData?.[0] || null,
      legal: legalData || [],
      events: eventsData || [],
      errors: {
        footer: footerError?.message,
        legal: legalError?.message,
        events: eventsError?.message
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to check content' }, { status: 500 })
  }
}
