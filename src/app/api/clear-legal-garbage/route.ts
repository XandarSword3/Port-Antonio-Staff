import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Delete all existing legal pages with garbage content
    const { error: deleteError } = await supabaseAdmin
      .from('legal_pages')
      .delete()
      .in('type', ['privacy', 'terms', 'accessibility'])

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Import fresh data from customer website
    const customerSiteUrl = 'https://port-antonio.vercel.app'
    const legalTypes = ['privacy', 'terms', 'accessibility']
    const imported = []

    for (const type of legalTypes) {
      try {
        // Fetch from customer site API
        const customerRes = await fetch(`${customerSiteUrl}/api/legal?type=${encodeURIComponent(type)}`, { cache: 'no-store' })
        if (!customerRes.ok) {
          console.log(`Failed to fetch ${type} from customer site: ${customerRes.status}`)
          continue
        }
        
        const customerData = await customerRes.json()
        const customerPage = customerData.legalPages && customerData.legalPages[0]
        if (!customerPage) {
          console.log(`No ${type} data found in customer API`)
          continue
        }
        
        // Insert the real data
        const { error: insertError } = await supabaseAdmin
          .from('legal_pages')
          .insert({
            type,
            title: customerPage.title || (type === 'privacy' ? 'Privacy Policy' : 
                                          type === 'terms' ? 'Terms of Service' : 
                                          'Accessibility Statement'),
            sections: customerPage.sections || []
          })
        
        if (!insertError) {
          imported.push(type)
        }
      } catch (e) {
        console.error(`Error importing ${type}:`, e)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleared garbage and imported real data for: ${imported.join(', ')}`,
      imported 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to clear and import' }, { status: 500 })
  }
}
