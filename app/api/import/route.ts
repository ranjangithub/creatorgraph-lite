import { getOrCreateDbUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { insertContentItems } from '@/lib/db/queries/content'
import {
  upsertTopics,
  insertHooks,
  upsertAudienceSegments,
  insertAudienceQuestions,
  tagContentItems,
} from '@/lib/db/queries/graph'
import { parseLinkedInCSV, parseDocumentText } from '@/lib/linkedin/parser'
import { extractGraphFromContent } from '@/lib/anthropic/prompts/graph-extraction'

// ── URL fetch + HTML → plain text ──────────────────────────────────────────

async function fetchUrlAsText(rawUrl: string): Promise<{ text: string; title: string }> {
  const res = await fetch(rawUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) throw new Error(`Could not fetch URL (${res.status})`)

  const html = await res.text()

  // Title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is)
  const title = (titleMatch?.[1] ?? rawUrl)
    .replace(/ \| LinkedIn$/i, '')
    .replace(/ [-|] Medium$/i, '')
    .replace(/ [-|] Substack$/i, '')
    .replace(/&amp;/g, '&')
    .trim()

  // Strip scripts, styles, nav, footer, then all tags
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, '\n')
    .trim()

  return { text, title }
}

// ── Route ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  let content: string
  let fileName: string

  if (body.url) {
    // URL-based import (Medium, Substack, GitHub, LinkedIn article)
    try {
      const { text, title } = await fetchUrlAsText(body.url as string)
      content  = `# ${title}\n\n${text}`
      fileName = `${(body.source as string | undefined) ?? 'url'}-import.md`
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch URL'
      return NextResponse.json({ error: msg }, { status: 422 })
    }
  } else if (body.content && body.fileName) {
    content  = body.content as string
    fileName = body.fileName as string
  } else {
    return NextResponse.json({ error: 'Provide either a URL or file content + fileName' }, { status: 400 })
  }

  // Parse content based on file type
  const parsed = fileName.endsWith('.csv')
    ? parseLinkedInCSV(content)
    : [parseDocumentText(content, fileName)]

  if (!parsed.length) {
    return NextResponse.json({ error: 'No content found in file' }, { status: 422 })
  }

  // Insert content items
  const inserted = await insertContentItems(
    parsed.map(p => ({
      userId:      user.id,
      platform:    p.platform,
      externalId:  p.externalId,
      title:       p.title ?? null,
      body:        p.body,
      url:         p.url ?? (body.url as string | undefined) ?? null,
      publishedAt: p.publishedAt ?? null,
    }))
  )

  // Build index → externalId map for the extraction batch (capped at 30)
  const batch = parsed.slice(0, 30)
  const indexToExternalId = new Map(batch.map((p, i) => [i + 1, p.externalId]))

  // Extract knowledge graph
  const graph = await extractGraphFromContent(
    batch.map((p, i) => ({
      index:       i + 1,
      title:       p.title,
      body:        p.body,
      platform:    p.platform,
      publishedAt: p.publishedAt?.toISOString(),
    }))
  )

  // Persist graph nodes
  const [savedTopics, savedHooks, savedSegments, savedQuestions] = await Promise.all([
    upsertTopics(user.id, graph.topics),
    insertHooks(user.id, graph.hooks),
    upsertAudienceSegments(user.id, graph.audienceSegments),
    insertAudienceQuestions(user.id, graph.audienceQuestions),
  ])

  await tagContentItems(user.id, graph.contentTags, indexToExternalId)

  return NextResponse.json({
    imported:  inserted.length,
    graph: {
      topics:    savedTopics.length,
      hooks:     savedHooks.length,
      segments:  savedSegments.length,
      questions: savedQuestions.length,
    },
    memories: savedTopics.length + savedHooks.length + savedQuestions.length,
  })
}
