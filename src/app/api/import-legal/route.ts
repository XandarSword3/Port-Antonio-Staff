import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function extractTextSections(html: string): { id: string; title: string; content: string; order: number }[] {
  // Strip scripts/styles
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, '')
  // Get body
  const bodyMatch = withoutStyles.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i)
  const body = bodyMatch ? bodyMatch[1] : withoutStyles
  // Split by headings h1-h3 into sections
  const parts = body
    .replace(/\r/g, '')
    .split(/<(h1|h2|h3)[^>]*>/i)
  const sections: { id: string; title: string; content: string; order: number }[] = []
  let currentTitle = ''
  let buffer = ''
  let order = 0
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (/^h[1-3]$/i.test(part)) {
      // flush previous
      if (buffer.trim()) {
        order += 1
        sections.push({ id: `sec-${order}`, title: currentTitle.trim(), content: buffer
          .replace(/<br\s*\/?>(\s*<br\s*\/?>)*/gi, '\n')
          .replace(/<\/(p|div|section|li)>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/\n\s*\n\s*\n+/g, '\n\n')
          .trim(), order })
        buffer = ''
      }
      // next element after tag name is the heading text block
      const headingHtml = parts[i+1] ?? ''
      currentTitle = headingHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      i += 1
      continue
    }
    buffer += part
  }
  if (buffer.trim()) {
    order += 1
    sections.push({ id: `sec-${order}`, title: currentTitle.trim(), content: buffer
      .replace(/<br\s*\/?>(\s*<br\s*\/?>)*/gi, '\n')
      .replace(/<\/(p|div|section|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim(), order })
  }
  // Fallback single section
  if (sections.length === 0) {
    return [{ id: 'main', title: '', content: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), order: 1 }]
  }
  return sections
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
    const { type, url, title } = await req.json() as { type: 'privacy' | 'terms' | 'accessibility', url: string, title?: string }
    if (!type || !url) return NextResponse.json({ error: 'type and url required' }, { status: 400 })

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: `Failed to fetch ${url}` }, { status: 502 })
    const html = await res.text()
    const sections = extractTextSections(html)
    const pageTitle = title || (type[0].toUpperCase()+type.slice(1))

    const { data, error } = await supabaseAdmin
      .from('legal_pages')
      .upsert({ type, title: pageTitle, sections }, { onConflict: 'type' })
      .select('*')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ legalPage: data?.[0] || null, imported: sections.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Import failed' }, { status: 500 })
  }
}


