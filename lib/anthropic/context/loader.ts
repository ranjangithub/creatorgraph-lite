// Context Loader — the heart of Context Engineering.
//
// Karpathy's principle: the context window is RAM. Load exactly what
// the LLM needs for this task. Not everything. Not nothing.
//
// This module traverses the knowledge graph and compiles it into a
// structured markdown string injected into every LLM call.
// The quality of this context determines the quality of the output.

import { db } from '@/lib/db'
import { contentItems } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { CONTEXT_LIMITS } from '@/lib/anthropic/client'
import { getTopics, getHooks, getOpenQuestions, getAudienceSegments } from '@/lib/db/queries/graph'

export interface CreatorContext {
  userId:        string
  memoryBlock:   string   // Compiled graph — loaded into context window
  recentContent: string   // Last N posts with their topic tags
  competitorBlock: string // Competitor landscape (reserved)
  builtAt:       string
  tokenEstimate: number
}

export async function buildCreatorContext(userId: string): Promise<CreatorContext> {
  const [topicList, hookList, questionList, segmentList, posts] = await Promise.all([
    getTopics(userId, CONTEXT_LIMITS.memoryEntries),
    getHooks(userId, 20),
    getOpenQuestions(userId, 20),
    getAudienceSegments(userId),
    db.select()
      .from(contentItems)
      .where(eq(contentItems.userId, userId))
      .orderBy(desc(contentItems.publishedAt))
      .limit(CONTEXT_LIMITS.contentItems),
  ])

  const memoryBlock    = buildMemoryBlock(topicList, hookList, questionList, segmentList)
  const recentContent  = buildRecentContentBlock(posts)
  const competitorBlock = ''

  const full = memoryBlock + recentContent
  const tokenEstimate = Math.ceil(full.length / 4)

  return { userId, memoryBlock, recentContent, competitorBlock, builtAt: new Date().toISOString(), tokenEstimate }
}

// ── Memory block ───────────────────────────────────────────────────────────
// Structured knowledge graph compiled into markdown the LLM reads directly.

function buildMemoryBlock(
  topicList:    Awaited<ReturnType<typeof getTopics>>,
  hookList:     Awaited<ReturnType<typeof getHooks>>,
  questionList: Awaited<ReturnType<typeof getOpenQuestions>>,
  segmentList:  Awaited<ReturnType<typeof getAudienceSegments>>,
): string {
  if (!topicList.length && !hookList.length && !questionList.length) return ''

  const sections: string[] = []

  // Topics — grouped by parent for hierarchy
  if (topicList.length) {
    const gapTopics    = topicList.filter(t => t.hasGap)
    const expertTopics = topicList.filter(t => !t.hasGap)

    if (expertTopics.length) {
      const lines = expertTopics.map(t =>
        `- ${t.name}${t.parentId ? '' : ' [core]'} (confidence: ${t.confidence}%)`
      ).join('\n')
      sections.push(`### TOPICS — CREATOR COVERS\n${lines}`)
    }

    if (gapTopics.length) {
      const lines = gapTopics.map(t => `- ${t.name} — audience asks, creator hasn't addressed`).join('\n')
      sections.push(`### TOPIC GAPS — HIGH OPPORTUNITY\n${lines}`)
    }
  }

  // Hooks — reusable creative assets
  if (hookList.length) {
    const byType: Record<string, typeof hookList> = {}
    for (const h of hookList) {
      if (!byType[h.hookType]) byType[h.hookType] = []
      byType[h.hookType].push(h)
    }
    const lines = Object.entries(byType).map(([type, items]) =>
      items.map(h => `- [${type}] ${h.text}`).join('\n')
    ).join('\n')
    sections.push(`### REUSABLE HOOKS & ANALOGIES\n${lines}`)
  }

  // Audience segments
  if (segmentList.length) {
    const names = segmentList.map(s => s.name).join(', ')
    sections.push(`### AUDIENCE SEGMENTS\n${names}`)
  }

  // Open questions — highest opportunity for content
  if (questionList.length) {
    const lines = questionList
      .filter(q => !q.resolved)
      .map(q => `- "${q.question}"${q.painPoint ? ` (pain: ${q.painPoint})` : ''}`)
      .join('\n')
    if (lines) sections.push(`### OPEN AUDIENCE QUESTIONS — NOT YET ANSWERED\n${lines}`)
  }

  return `## CREATOR KNOWLEDGE GRAPH\n${sections.join('\n\n')}\n\n`
}

// ── Recent content block ───────────────────────────────────────────────────

function buildRecentContentBlock(posts: Array<Record<string, unknown>>): string {
  if (!posts.length) return ''

  const items = (posts as Array<{
    title: string | null; platform: string; publishedAt: Date | null
    views: number | null; likes: number | null; comments: number | null
    topics: string[] | null; hooks: string[] | null
    summary: string | null; body: string
  }>).map(p => {
    const date   = p.publishedAt ? new Date(p.publishedAt).toISOString().split('T')[0] : 'unknown'
    const perf   = `views:${p.views ?? 0} likes:${p.likes ?? 0} comments:${p.comments ?? 0}`
    const topics = (p.topics as string[] ?? []).join(', ')
    const hooks  = (p.hooks  as string[] ?? []).join(', ')
    return `### ${p.title ?? 'Untitled'} [${p.platform}] ${date}
Performance: ${perf}
Topics: ${topics || 'untagged'}
Hooks used: ${hooks || 'none'}
${p.summary ?? p.body.slice(0, 300)}`
  })

  return `## RECENT CONTENT (last ${posts.length} posts)\n${items.join('\n\n')}\n\n`
}
