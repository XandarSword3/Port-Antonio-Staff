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
  const [activeTab, setActiveTab] = useState<'footer'>('footer')
  const [footer, setFooter] = useState<Footer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    initializeAndLoadContent()
  }, [])

  async function initializeAndLoadContent() {
    try {
      await loadFooter()
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

  // Legal functionality removed

  async function saveFooter() {
    if (!footer) return
    setSaving(true)
    const res = await fetch('/api/footer', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(footer) })
    setSaving(false)
    if (!res.ok) alert('Failed to save footer')
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
        <button onClick={()=>setActiveTab('footer')} className={`px-4 py-2 rounded ${activeTab==='footer'?'bg-staff-600 text-white':'bg-gray-100'}`}>Footer</button>
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

      {/* Legal tabs removed */}
    </div>
  )
}


