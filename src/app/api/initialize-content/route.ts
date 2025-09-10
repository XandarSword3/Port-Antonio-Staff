import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Initialize footer settings
    const { data: existingFooter } = await supabaseAdmin
      .from('footer_settings')
      .select('id')
      .limit(1);

    if (!existingFooter || existingFooter.length === 0) {
      const { error: footerError } = await supabaseAdmin
        .from('footer_settings')
        .insert([{
          company_name: 'Port Antonio Resort',
          description: 'Luxury beachfront resort with world-class dining',
          address: 'Port Antonio, Mastita, Lebanon',
          phone: '+1 (876) 555-0123',
          email: 'info@portantonio.com',
          dining_hours: 'Dining Available 24/7',
          dining_location: 'Main Restaurant & Beachside',
          social_links: {
            facebook: 'https://facebook.com/portantonio',
            instagram: 'https://instagram.com/portantonio',
            twitter: 'https://twitter.com/portantonio',
            linkedin: 'https://linkedin.com/company/portantonio'
          }
        }]);

      if (footerError) throw footerError;
    }

    // Only initialize if tables are completely empty - don't overwrite existing data
    const legalPages = [];

    for (const page of legalPages) {
      const { data: existingPage } = await supabaseAdmin
        .from('legal_pages')
        .select('id')
        .eq('type', page.type)
        .limit(1);

      if (!existingPage || existingPage.length === 0) {
        const { error: pageError } = await supabaseAdmin
          .from('legal_pages')
          .insert([page]);

        if (pageError) throw pageError;
      }
    }

    return NextResponse.json({ success: true, message: 'Content initialized successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to initialize content' }, { status: 500 })
  }
}
