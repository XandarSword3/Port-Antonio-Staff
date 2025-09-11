import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function fetchAndExtract(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const html = await res.text()
    // Very basic extraction: strip scripts/styles and tags
    const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '')
    const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, '')
    const bodyMatch = withoutStyles.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i)
    const body = bodyMatch ? bodyMatch[1] : withoutStyles
    const text = body
      .replace(/<br\s*\/?>(\s*<br\s*\/?>)*/gi, '\n')
      .replace(/<\/(p|div|section|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim()
    return text || null
  } catch {
    return null
  }
}

export async function POST() {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })

    const privacyUrl = process.env.CUSTOMER_PRIVACY_URL
    const termsUrl = process.env.CUSTOMER_TERMS_URL
    const accessibilityUrl = process.env.CUSTOMER_ACCESSIBILITY_URL

    const results: Record<string, any> = { updated: [] }

    const tasks: Array<Promise<void>> = []

    const maybeSync = (type: 'privacy' | 'terms' | 'accessibility', url?: string | null) => {
      if (!url) return
      tasks.push((async () => {
        const content = await fetchAndExtract(url)
        if (!content) return
        const section = [{ id: 'main', title: '', content, order: 1 }]
        const { error } = await supabaseAdmin
          .from('legal_pages')
          .upsert({ type, title: type[0].toUpperCase() + type.slice(1), sections: section }, { onConflict: 'type' })
        if (!error) results.updated.push(type)
      })())
    }

    maybeSync('privacy', privacyUrl)
    maybeSync('terms', termsUrl)
    maybeSync('accessibility', accessibilityUrl)

    await Promise.all(tasks)

    return NextResponse.json(results)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to sync legal' }, { status: 500 })
  }
}


