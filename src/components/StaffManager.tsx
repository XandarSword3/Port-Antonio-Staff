'use client';

import { useEffect, useState } from 'react'

interface StaffUserRow {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  role: 'worker' | 'admin' | 'owner'
  department?: string
  phone?: string
  is_active: boolean
  pin?: string
}

export default function StaffManager() {
  const [users, setUsers] = useState<StaffUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Partial<StaffUserRow>>({ role: 'worker', is_active: true })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const res = await fetch('/api/users', { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setUsers(json.users || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    const payload = { ...form }
    const method = editingId ? 'PUT' : 'POST'
    const body = editingId ? { id: editingId, ...payload } : payload
    const res = await fetch('/api/users', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { alert('Save failed'); return }
    setForm({ role: 'worker', is_active: true })
    setEditingId(null)
    await loadUsers()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this user?')) return
    const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { alert('Delete failed'); return }
    await loadUsers()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-staff-600"></div>
          <span className="ml-3 text-gray-600">Loading staff...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card p-6 text-red-700 bg-red-50 border border-red-200">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add / Edit Staff User</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input" placeholder="Email" value={form.email || ''} onChange={e=>setForm({...form, email:e.target.value})} />
          <input className="input" placeholder="Username" value={form.username || ''} onChange={e=>setForm({...form, username:e.target.value})} />
          <input className="input" placeholder="First name" value={form.first_name || ''} onChange={e=>setForm({...form, first_name:e.target.value})} />
          <input className="input" placeholder="Last name" value={form.last_name || ''} onChange={e=>setForm({...form, last_name:e.target.value})} />
          <select className="input" value={form.role || 'worker'} onChange={e=>setForm({...form, role:e.target.value as any})}>
            <option value="worker">Worker</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
          <input className="input" placeholder="Department" value={form.department || ''} onChange={e=>setForm({...form, department:e.target.value})} />
          <input className="input" placeholder="Phone" value={form.phone || ''} onChange={e=>setForm({...form, phone:e.target.value})} />
          <input className="input" placeholder="PIN" value={form.pin || ''} onChange={e=>setForm({...form, pin:e.target.value})} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active ?? true} onChange={e=>setForm({...form, is_active:e.target.checked})} /> Active</label>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleSave} className="btn-primary px-4 py-2">{editingId ? 'Save' : 'Create'}</button>
          {editingId && <button onClick={()=>{setEditingId(null); setForm({ role:'worker', is_active: true })}} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff Users</h2>
        {users.length === 0 ? (
          <div className="text-gray-600">No users yet.</div>
        ) : (
          <div className="grid gap-3">
            {users.map(u => (
              <div key={u.id} className="bg-white p-4 rounded border flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{u.first_name} {u.last_name} <span className="text-sm text-gray-500">({u.username})</span></div>
                  <div className="text-sm text-gray-600">{u.email} • {u.role} • {u.is_active ? 'Active' : 'Inactive'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>{setEditingId(u.id); setForm({...u})}} className="px-3 py-1 bg-blue-600 text-white rounded">Edit</button>
                  <button onClick={()=>handleDelete(u.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
