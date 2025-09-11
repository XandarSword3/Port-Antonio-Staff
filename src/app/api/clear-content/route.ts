import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
    }

    // Clear all hardcoded content from legal_pages
    const { error: legalError } = await supabaseAdmin
      .from('legal_pages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (legalError) throw legalError

    // Clear footer settings too to start fresh
    const { error: footerError } = await supabaseAdmin
      .from('footer_settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (footerError) throw footerError

    return NextResponse.json({ 
      success: true, 
      message: 'Hardcoded content cleared from database. Staff portal will now load from customer website database.' 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to clear content' }, { status: 500 })
  }
}
