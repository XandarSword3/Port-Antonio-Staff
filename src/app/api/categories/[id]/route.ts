import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(req: Request, { params }: any) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
    }
    const { id } = params
    const body = await req.json()
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(body)
      .eq('id', id)
      .select('*')

    if (error) throw error
    return NextResponse.json({ category: data?.[0] ?? null })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: any) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
    }
    const { id } = params
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete category' }, { status: 500 })
  }
}


