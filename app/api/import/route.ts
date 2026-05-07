import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUserByClerkId } from '@/lib/db/queries/users'
import { insertContentItems } from '@/lib/db/queries/content'
import { insertMemoryEntries } from '@/lib/db/queries/memory'
import { parseLinkedInCSV, parseDocumentText } from '@/lib/linkedin/parser'
import { extractMemoriesFromContent } from '@/lib/anthropic/prompts/memory-extraction'

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

  // Insert content items (conflict ignored — same externalId won't double-insert)
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

  // Extract memories from this batch (capped at 30 items to control token use)
  const batch = parsed.slice(0, 30).map(p => ({
    title:       p.title,
    body:        p.body,
    platform:    p.platform,
    publishedAt: p.publishedAt?.toISOString(),
  }))

  const extracted = await extractMemoriesFromContent(batch)

  const savedMemories = await insertMemoryEntries(
    extracted.map(m => ({
      userId:     user.id,
      type:       m.type,
      content:    m.content,
      confidence: m.confidence,
      tags:       m.tags,
    }))
  )

  return NextResponse.json({
    imported:  inserted.length,
    memories:  savedMemories.length,
  })
}
