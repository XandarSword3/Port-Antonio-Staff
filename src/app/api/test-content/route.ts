import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Check what's actually in the database
    const { data: footerData, error: footerError } = await supabaseAdmin
      .from('footer_settings')
      .select('*')
      .limit(1);

    const { data: careersData, error: careersError } = await supabaseAdmin
      .from('legal_pages')
      .select('*')
      .eq('type', 'careers')
      .limit(1);

    return NextResponse.json({
      footer: footerData?.[0] || null,
      careers: careersData?.[0] || null,
      errors: {
        footer: footerError?.message,
        careers: careersError?.message
      },
      message: 'Check this data to see what the staff portal is loading'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to check content' }, { status: 500 })
  }
}
