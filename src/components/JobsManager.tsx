'use client'

import { useEffect, useState } from 'react'

type Job = {
  id?: string
  title: string
  department: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  location: string
  description: string
  requirements: string[]
  benefits: string[]
  salary?: string
  active: boolean
}

export default function JobsManager() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Job>>({ type: 'full-time', active: true })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(()=>{ loadJobs() },[])

  async function loadJobs() {
    try {
      const res = await fetch('/api/jobs', { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setJobs(json.jobs || [])
    } catch (e:any) {
      setError(e?.message || 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  async function saveJob() {
    const payload: any = {
      ...form,
      requirements: (form.requirements as any) || [],
      benefits: (form.benefits as any) || [],
    }
    if (typeof payload.requirements === 'string') payload.requirements = payload.requirements.split('\n').filter(Boolean)
    if (typeof payload.benefits === 'string') payload.benefits = payload.benefits.split('\n').filter(Boolean)
    const method = editingId ? 'PUT' : 'POST'
    const body = editingId ? { id: editingId, ...payload } : payload
    const res = await fetch('/api/jobs', { method, headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { alert('Save failed'); return }
    setForm({ type: 'full-time', active: true })
    setEditingId(null)
    await loadJobs()
  }

  async function deleteJob(id: string) {
    if (!confirm('Delete this job?')) return
    const res = await fetch(`/api/jobs?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { alert('Delete failed'); return }
    await loadJobs()
  }

  if (loading) return <div className="p-6">Loading jobs...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 space-y-6">
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{editingId ? 'Edit Job' : 'Add Job'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input" placeholder="Title" value={form.title || ''} onChange={e=>setForm({...form, title:e.target.value})} />
          <input className="input" placeholder="Department" value={form.department || ''} onChange={e=>setForm({...form, department:e.target.value})} />
          <select className="input" value={form.type || 'full-time'} onChange={e=>setForm({...form, type:e.target.value as any})}>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
          <input className="input" placeholder="Location" value={form.location || ''} onChange={e=>setForm({...form, location:e.target.value})} />
          <textarea className="input md:col-span-2" placeholder="Description" value={form.description || ''} onChange={e=>setForm({...form, description:e.target.value})} />
          <textarea className="input" placeholder="Requirements (one per line)" value={typeof form.requirements === 'string' ? form.requirements : (form.requirements||[]).join('\n')} onChange={e=>setForm({...form, requirements:e.target.value})} />
          <textarea className="input" placeholder="Benefits (one per line)" value={typeof form.benefits === 'string' ? form.benefits : (form.benefits||[]).join('\n')} onChange={e=>setForm({...form, benefits:e.target.value})} />
          <input className="input" placeholder="Salary (optional)" value={form.salary || ''} onChange={e=>setForm({...form, salary:e.target.value})} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active ?? true} onChange={e=>setForm({...form, active:e.target.checked})} /> Active</label>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={saveJob} className="btn-primary px-4 py-2">{editingId ? 'Save' : 'Create'}</button>
          {editingId && <button onClick={()=>{setEditingId(null); setForm({ type:'full-time', active:true })}} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Listings</h2>
        {jobs.length === 0 ? (
          <div className="text-gray-600">No jobs yet.</div>
        ) : (
          <div className="grid gap-3">
            {jobs.map(j => (
              <div key={j.id} className="bg-white p-4 rounded border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{j.title} <span className="text-sm text-gray-500">({j.department})</span></div>
                    <div className="text-sm text-gray-600">{j.type} • {j.location} • {j.active ? 'Active' : 'Inactive'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>{setEditingId(j.id!); setForm({ ...j, requirements:j.requirements, benefits:j.benefits })}} className="px-3 py-1 bg-blue-600 text-white rounded">Edit</button>
                    <button onClick={()=>deleteJob(j.id!)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


