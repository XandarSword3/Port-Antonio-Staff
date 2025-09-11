import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Import from customer website (server-side, no CORS issues)
    const customerSiteUrl = 'https://port-antonio.vercel.app'
    const legalTypes = ['privacy', 'terms', 'accessibility']
    const imported = []

    for (const type of legalTypes) {
      try {
        // Fetch from customer site API (server-side)
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
        
        // Upsert the data
        const { data, error } = await supabaseAdmin
          .from('legal_pages')
          .upsert({
            type,
            title: customerPage.title || (type === 'privacy' ? 'Privacy Policy' : 
                                          type === 'terms' ? 'Terms of Service' : 
                                          'Accessibility Statement'),
            sections: customerPage.sections || []
          })
          .select()

        if (error) {
          console.error(`Error importing ${type}:`, error)
          continue
        }

        imported.push({ type, success: true, data })

      } catch (e) {
        console.error(`Error importing ${type}:`, e)
        imported.push({ type, success: false, error: String(e) })
      }
    }

    return NextResponse.json({ 
      message: 'Import completed',
      imported,
      success: imported.filter(i => i.success).length,
      failed: imported.filter(i => !i.success).length
    })

  } catch (error) {
    console.error('Error importing from customer:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
