/**
 * Context Loader — the heart of Context Engineering.
 *
 * Karpathy's principle: the context window is RAM. Load exactly what
 * the LLM needs for this task. Not everything. Not nothing.
 *
 * This module builds the context string that gets injected into every
 * LLM call. The quality of this context determines the quality of the output.
 */

import { db } from '@/lib/db'
import { memoryEntries, contentItems, competitors } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { CONTEXT_LIMITS } from '@/lib/anthropic/client'

export interface CreatorContext {
  userId:        string
  memoryBlock:   string   // Compiled memory — loaded into context window
  recentContent: string   // Last N posts — what the creator has said recently
  competitorBlock: string // Competitor landscape
  builtAt:       string   // Timestamp — context is a snapshot, not live data
  tokenEstimate: number
}

// ── Build full creator context ─────────────────────────────────────────────
// Called before any LLM request. Returns a structured context string
// the model reads directly — no vector search, no retrieval, no RAG.

export async function buildCreatorContext(userId: string): Promise<CreatorContext> {
  const [memories, posts, competitorList] = await Promise.all([
    db.select()
      .from(memoryEntries)
      .where(eq(memoryEntries.userId, userId))
      .orderBy(desc(memoryEntries.createdAt))
      .limit(CONTEXT_LIMITS.memoryEntries),

    db.select()
      .from(contentItems)
      .where(eq(contentItems.userId, userId))
      .orderBy(desc(contentItems.publishedAt))
      .limit(CONTEXT_LIMITS.contentItems),

    db.select()
      .from(competitors)
      .where(eq(competitors.userId, userId))
      .limit(10),
  ])

  const memoryBlock = buildMemoryBlock(memories)
  const recentContent = buildRecentContentBlock(posts)
  const competitorBlock = buildCompetitorBlock(competitorList)

  const full = memoryBlock + recentContent + competitorBlock
  const tokenEstimate = Math.ceil(full.length / 4)

  return {
    userId,
    memoryBlock,
    recentContent,
    competitorBlock,
    builtAt:  new Date().toISOString(),
    tokenEstimate,
  }
}

// ── Memory block ───────────────────────────────────────────────────────────
// Groups memory entries by type so the model can scan them efficiently.

function buildMemoryBlock(memories: typeof memoryEntries.$inferSelect[]): string {
  if (!memories.length) return ''

  const grouped: Record<string, typeof memories> = {}
  for (const m of memories) {
    if (!grouped[m.type]) grouped[m.type] = []
    grouped[m.type].push(m)
  }

  const sections = Object.entries(grouped).map(([type, entries]) => {
    const label = type.replace(/_/g, ' ').toUpperCase()
    const items = entries.map(e => `- ${e.content} (confidence: ${e.confidence}%)`).join('\n')
    return `### ${label}\n${items}`
  })

  return `## CREATOR MEMORY\n${sections.join('\n\n')}\n\n`
}

// ── Recent content block ───────────────────────────────────────────────────

function buildRecentContentBlock(posts: typeof contentItems.$inferSelect[]): string {
  if (!posts.length) return ''

  const items = posts.map(p => {
    const date = p.publishedAt ? new Date(p.publishedAt).toISOString().split('T')[0] : 'unknown'
    const perf = `views:${p.views ?? 0} likes:${p.likes ?? 0} comments:${p.comments ?? 0}`
    const topics = (p.topics as string[] ?? []).join(', ')
    return `### ${p.title ?? 'Untitled'} [${p.platform}] ${date}\nPerformance: ${perf}\nTopics: ${topics}\n${p.summary ?? p.body.slice(0, 300)}`
  })

  return `## RECENT CONTENT (last ${posts.length} posts)\n${items.join('\n\n')}\n\n`
}

// ── Competitor block ───────────────────────────────────────────────────────

function buildCompetitorBlock(comps: typeof competitors.$inferSelect[]): string {
  if (!comps.length) return ''
  const items = comps.map(c => `- ${c.name} (${c.platform}: @${c.handle})${c.notes ? ` — ${c.notes}` : ''}`).join('\n')
  return `## TRACKED COMPETITORS\n${items}\n\n`
}
