import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Get footer content
    const { data: footerData, error: footerError } = await supabaseAdmin
      .from('footer_settings')
      .select('*')
      .limit(1);

    // Get all legal pages
    const { data: legalData, error: legalError } = await supabaseAdmin
      .from('legal_pages')
      .select('*')
      .order('type');

    // Organize legal pages by type
    const legalPages = legalData?.reduce((acc, page) => {
      acc[page.type] = page;
      return acc;
    }, {} as Record<string, any>) || {};

    return NextResponse.json({
      footer: footerData?.[0] || null,
      legal: legalPages,
      success: true
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load content' }, { status: 500 })
  }
}
