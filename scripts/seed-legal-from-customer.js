// Seed legal_pages from the customer site's public API
// Usage:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-legal-from-customer.js

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CUSTOMER_BASE = process.env.CUSTOMER_BASE || 'https://port-san-antonio.vercel.app'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function fetchCustomerLegal(type) {
  const url = `${CUSTOMER_BASE}/api/legal?type=${encodeURIComponent(type)}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch ${type} from customer: ${res.status}`)
  const json = await res.json()
  const page = json.legalPages && json.legalPages[0]
  if (!page) throw new Error(`No ${type} in customer API`)
  return { title: page.title || type[0].toUpperCase() + type.slice(1), sections: page.sections || [] }
}

async function upsert(type, title, sections) {
  const { error } = await admin.from('legal_pages').upsert({ type, title, sections }, { onConflict: 'type' })
  if (error) throw error
}

async function main() {
  try {
    const types = ['privacy', 'terms', 'accessibility']
    for (const t of types) {
      try {
        const { title, sections } = await fetchCustomerLegal(t)
        await upsert(t, title, sections)
        console.log(`✓ Seeded ${t} (${sections.length} sections) from customer API`)
      } catch (e) {
        console.warn(`! Skipped ${t}: ${e.message}`)
      }
    }
    console.log('Done.')
  } catch (e) {
    console.error('Seed failed:', e)
    process.exit(1)
  }
}

main()


