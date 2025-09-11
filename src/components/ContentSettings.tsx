'use client'

import { useEffect, useState } from 'react'

type Footer = {
  id?: string
  company_name: string
  description: string
  address: string
  phone: string
  email: string
  dining_hours: string
  dining_location: string
  social_links: Record<string, string>
}

type LegalPage = {
  id?: string
  type: 'privacy' | 'terms' | 'accessibility'
  title: string
  sections: Array<{ id: string; title: string; content: string; order: number }>
}

export default function ContentSettings() {
  const [activeTab, setActiveTab] = useState<'footer' | 'privacy' | 'terms' | 'accessibility'>('footer')
  const [footer, setFooter] = useState<Footer | null>(null)
  const [legal, setLegal] = useState<Record<'privacy' | 'terms' | 'accessibility', LegalPage | null>>({ privacy: null, terms: null, accessibility: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    initializeAndLoadContent()
  }, [])

  async function initializeAndLoadContent() {
    try {
      await Promise.all([loadFooter(), loadAllLegal()])
    } catch (e) {
      console.error('Error initializing content:', e)
    } finally {
      setLoading(false)
    }
  }


  async function loadFooter() {
    try {
      const res = await fetch('/api/footer', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (json.footer) setFooter(json.footer)
        else setFooter({ company_name: '', description: '', address: '', phone: '', email: '', dining_hours: '', dining_location: '', social_links: {} })
      } else {
        console.error('Failed to load footer:', await res.text())
        setFooter({ company_name: '', description: '', address: '', phone: '', email: '', dining_hours: '', dining_location: '', social_links: {} })
      }
    } catch (e) {
      console.error('Error loading footer:', e)
      setFooter({ company_name: '', description: '', address: '', phone: '', email: '', dining_hours: '', dining_location: '', social_links: {} })
    }
  }

  async function loadAllLegal() {
    try {
      const res = await fetch('/api/legal', { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      const pages: LegalPage[] = (await res.json()).legalPages || []
      const byType = pages.reduce((acc: any, p: LegalPage) => { acc[p.type] = p; return acc }, {})
      
      // Check if existing pages have placeholder content and import from customer site
      const isPlaceholderContent = (content: string) => {
        return content.includes('<PASTE REAL') || 
               content.includes('PASTE REAL') || 
               content.length < 50 || 
               content.trim() === ''
      }

      const hasPlaceholderSections = (sections: any[]) => {
        return !sections || sections.length === 0 || 
               sections.some(s => isPlaceholderContent(s.content))
      }
      
      // Import from customer website for missing or placeholder pages
      const customerSiteUrl = 'https://port-antonio.vercel.app'
      const legalTypes = ['privacy', 'terms', 'accessibility'] as const
      
      for (const type of legalTypes) {
        const existingPage = byType[type]
        const needsImport = !existingPage || hasPlaceholderSections(existingPage.sections)
        
        if (needsImport) {
          try {
            console.log(`Importing ${type} from customer website...`)
            
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
            
            // Import via our API
            const importData = {
              type,
              title: customerPage.title || (type === 'privacy' ? 'Privacy Policy' : 
                                            type === 'terms' ? 'Terms of Service' : 
                                            'Accessibility Statement'),
              sections: customerPage.sections || []
            }
            
            const importRes = await fetch('/api/legal', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(importData)
            })
            
            if (importRes.ok) {
              const imported = await importRes.json()
              if (imported.legalPage) {
                byType[type] = imported.legalPage
                console.log(`✓ Imported ${type} page successfully`)
              }
            } else {
              console.log(`Failed to save imported ${type}:`, await importRes.text())
            }
          } catch (e) {
            console.error(`Error importing ${type}:`, e)
          }
        }
      }

      setLegal({
        privacy: byType.privacy || { type: 'privacy', title: 'Privacy Policy', sections: [] },
        terms: byType.terms || { type: 'terms', title: 'Terms of Service', sections: [] },
        accessibility: byType.accessibility || { type: 'accessibility', title: 'Accessibility Statement', sections: [] }
      })
    } catch (e) {
      console.error('Error loading legal pages:', e)
      setLegal({
        privacy: { type: 'privacy', title: 'Privacy Policy', sections: [] },
        terms: { type: 'terms', title: 'Terms of Service', sections: [] },
        accessibility: { type: 'accessibility', title: 'Accessibility Statement', sections: [] }
      })
    }
  }

  async function saveFooter() {
    if (!footer) return
    setSaving(true)
    const res = await fetch('/api/footer', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(footer) })
    setSaving(false)
    if (!res.ok) alert('Failed to save footer')
  }

  async function saveLegal(type: 'privacy' | 'terms' | 'accessibility') {
    const page = legal[type]
    if (!page) return
    setSaving(true)
    const payload = { type: page.type, title: page.title, sections: page.sections }
    const res = await fetch('/api/legal', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (!res.ok) alert('Failed to save')
    else await loadAllLegal()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-staff-600"></div>
          <span className="ml-3 text-gray-600">Loading content settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        {(['footer','privacy','terms','accessibility'] as const).map(tab => (
          <button key={tab} onClick={()=>setActiveTab(tab)} className={`px-4 py-2 rounded ${activeTab===tab?'bg-staff-600 text-white':'bg-gray-100'}`}>{tab[0].toUpperCase()+tab.slice(1)}</button>
        ))}
      </div>

      {activeTab==='footer' && footer && (
        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input" placeholder="Company name" value={footer.company_name} onChange={e=>setFooter({...footer, company_name:e.target.value})} />
            <input className="input" placeholder="Phone" value={footer.phone} onChange={e=>setFooter({...footer, phone:e.target.value})} />
            <input className="input" placeholder="Email" value={footer.email} onChange={e=>setFooter({...footer, email:e.target.value})} />
            <input className="input" placeholder="Dining hours" value={footer.dining_hours} onChange={e=>setFooter({...footer, dining_hours:e.target.value})} />
            <input className="input" placeholder="Dining location" value={footer.dining_location} onChange={e=>setFooter({...footer, dining_location:e.target.value})} />
          </div>
          <textarea className="input" placeholder="Description" value={footer.description} onChange={e=>setFooter({...footer, description:e.target.value})} />
          <textarea className="input" placeholder="Address" value={footer.address} onChange={e=>setFooter({...footer, address:e.target.value})} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input" placeholder="Facebook URL" value={footer.social_links.facebook||''} onChange={e=>setFooter({...footer, social_links:{...footer.social_links, facebook:e.target.value}})} />
            <input className="input" placeholder="Instagram URL" value={footer.social_links.instagram||''} onChange={e=>setFooter({...footer, social_links:{...footer.social_links, instagram:e.target.value}})} />
            <input className="input" placeholder="Twitter URL" value={footer.social_links.twitter||''} onChange={e=>setFooter({...footer, social_links:{...footer.social_links, twitter:e.target.value}})} />
            <input className="input" placeholder="LinkedIn URL" value={footer.social_links.linkedin||''} onChange={e=>setFooter({...footer, social_links:{...footer.social_links, linkedin:e.target.value}})} />
          </div>
          <div className="flex gap-2">
            <button disabled={saving} onClick={saveFooter} className="btn-primary px-4 py-2 disabled:opacity-50">Save Footer</button>
          </div>
        </div>
      )}

      {(['privacy','terms','accessibility'] as const).map(type => (
        activeTab===type && legal[type] && (
          <div key={type} className="card p-6 space-y-4">
            <input className="input" placeholder="Title" value={legal[type]!.title} onChange={e=>setLegal(prev=>({ ...prev, [type]: { ...(prev[type] as LegalPage), title:e.target.value } }))} />
            <div className="space-y-3">
              {(legal[type]!.sections || []).sort((a,b)=>a.order-b.order).map((s, idx) => (
                <div key={s.id || idx} className="bg-gray-50 p-3 rounded">
                  <input className="input mb-2" placeholder="Section title" value={s.title} onChange={e=>{
                    const updated = [...legal[type]!.sections]; updated[idx] = { ...s, title:e.target.value }; setLegal(prev=>({ ...prev, [type]: { ...(prev[type] as LegalPage), sections: updated } }))
                  }} />
                  <textarea className="input" placeholder="Content" value={s.content} onChange={e=>{ const updated = [...legal[type]!.sections]; updated[idx] = { ...s, content:e.target.value }; setLegal(prev=>({ ...prev, [type]: { ...(prev[type] as LegalPage), sections: updated } })) }} />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>{ const page = legal[type]!; const nextOrder = (page.sections?.length||0)+1; const sec = { id: crypto.randomUUID(), title:'', content:'', order: nextOrder }; setLegal(prev=>({ ...prev, [type]: { ...(prev[type] as LegalPage), sections: [ ...(prev[type]?.sections||[]), sec ] } })) }} className="px-4 py-2 bg-gray-200 rounded">Add Section</button>
              <button disabled={saving} onClick={()=>saveLegal(type)} className="btn-primary px-4 py-2 disabled:opacity-50">{`Save ${type[0].toUpperCase()+type.slice(1)}`}</button>
            </div>
          </div>
        )
      ))}
    </div>
  )
}


