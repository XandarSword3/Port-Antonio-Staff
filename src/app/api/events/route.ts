import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const client = supabaseAdmin ?? supabase
    if (!client) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    const { data, error } = await client
      .from('events')
      .select('*')
      .order('date', { ascending: true })
      .limit(limit)

    if (error) throw error
    return NextResponse.json({ events: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load events' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const client = supabaseAdmin ?? supabase
    if (!client) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const body = await req.json()
    
    const { data, error } = await client
      .from('events')
      .insert([{
        title: body.title,
        description: body.description,
        date: body.date,
        start_time: body.startTime,
        end_time: body.endTime,
        location: body.location,
        max_capacity: body.maxCapacity,
        current_capacity: body.currentCapacity || 0,
        price: body.price,
        currency: body.currency || 'USD',
        image: body.image,
        category: body.category,
        status: body.status || 'draft',
        featured_until: body.featuredUntil,
        created_by: body.createdBy || 'system'
      }])
      .select('*')

    if (error) throw error
    return NextResponse.json({ event: data?.[0] || null })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create event' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const client = supabaseAdmin ?? supabase
    if (!client) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const body = await req.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    const { data, error } = await client
      .from('events')
      .update({
        title: updateData.title,
        description: updateData.description,
        date: updateData.date,
        start_time: updateData.startTime,
        end_time: updateData.endTime,
        location: updateData.location,
        max_capacity: updateData.maxCapacity,
        current_capacity: updateData.currentCapacity,
        price: updateData.price,
        currency: updateData.currency,
        image: updateData.image,
        category: updateData.category,
        status: updateData.status,
        featured_until: updateData.featuredUntil,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')

    if (error) throw error
    return NextResponse.json({ event: data?.[0] || null })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const client = supabaseAdmin ?? supabase
    if (!client) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('id')
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    const { error } = await client
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete event' }, { status: 500 })
  }
}
