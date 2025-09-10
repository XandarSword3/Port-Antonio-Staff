'use client';

import { useEffect, useState } from 'react'

interface Order {
  id: string
  order_number?: string
  customer_name?: string
  total?: number
  status?: string
  payment_status?: string
  created_at?: string
}

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await fetch('/api/orders?limit=50', { cache: 'no-store' })
        if (!res.ok) throw new Error(await res.text())
        const json = await res.json()
        setOrders(json.orders || [])
      } catch (e: any) {
        setError(e?.message || 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-staff-600"></div>
          <span className="ml-3 text-gray-600">Loading orders...</span>
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
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Orders</h2>
      {orders.length === 0 ? (
        <div className="card p-8 text-center text-gray-600">No orders yet.</div>
      ) : (
        <div className="grid gap-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">Order {o.order_number || o.id}</div>
                <div className="text-sm text-gray-600">{o.customer_name || 'Guest'}</div>
                <div className="text-xs text-gray-500">{o.created_at ? new Date(o.created_at).toLocaleString() : ''}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm">Status: <span className="font-medium">{o.status || 'pending'}</span></div>
                <div className="text-sm">Payment: <span className="font-medium">{o.payment_status || 'pending'}</span></div>
                <div className="text-lg font-bold text-staff-700">${(o.total || 0).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
