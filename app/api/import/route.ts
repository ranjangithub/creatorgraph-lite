import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUserByClerkId } from '@/lib/db/queries/users'
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

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getUserByClerkId(clerkId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body?.content || !body?.fileName) {
    return NextResponse.json({ error: 'Missing content or fileName' }, { status: 400 })
  }

  const { content, fileName } = body as { content: string; fileName: string }

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
      url:         p.url ?? null,
      publishedAt: p.publishedAt ?? null,
    }))
  )

  // Build index → externalId map for the extraction batch (capped at 30)
  const batch = parsed.slice(0, 30)
  const indexToExternalId = new Map(batch.map((p, i) => [i + 1, p.externalId]))

  // Extract knowledge graph — Topics, Hooks, AudienceSegments, AudienceQuestions
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

  // Tag content items with their topics and hooks (updates the JSONB columns)
  await tagContentItems(user.id, graph.contentTags, indexToExternalId)

  return NextResponse.json({
    imported:  inserted.length,
    graph: {
      topics:    savedTopics.length,
      hooks:     savedHooks.length,
      segments:  savedSegments.length,
      questions: savedQuestions.length,
    },
    // Legacy field — uploader component reads this
    memories: savedTopics.length + savedHooks.length + savedQuestions.length,
  })
}
