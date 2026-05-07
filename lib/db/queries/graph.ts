import { db, topics, hooks, audienceSegments, audienceQuestions, contentItems } from '@/lib/db'
import { eq, desc, count, sql } from 'drizzle-orm'
import type { GraphExtraction } from '@/lib/anthropic/prompts/graph-extraction'

// ── Upsert helpers ─────────────────────────────────────────────────────────

export async function upsertTopics(userId: string, extracted: GraphExtraction['topics']) {
  if (!extracted.length) return []
  return Promise.all(
    extracted.map(t =>
      db.insert(topics)
        .values({ userId, name: t.name, parentId: null, hasGap: t.hasGap, confidence: t.confidence })
        .onConflictDoUpdate({
          target:  [topics.userId, topics.name],
          set:     { hasGap: t.hasGap, confidence: t.confidence },
        })
        .returning()
    )
  ).then(rows => rows.flat())
}

export async function insertHooks(userId: string, extracted: GraphExtraction['hooks']) {
  if (!extracted.length) return []
  return db.insert(hooks)
    .values(extracted.map(h => ({ userId, text: h.text, hookType: h.hookType, confidence: h.confidence })))
    .returning()
}

export async function upsertAudienceSegments(userId: string, names: string[]) {
  if (!names.length) return []
  return Promise.all(
    names.map(name =>
      db.insert(audienceSegments)
        .values({ userId, name })
        .onConflictDoUpdate({ target: [audienceSegments.userId, audienceSegments.name], set: { name } })
        .returning()
    )
  ).then(rows => rows.flat())
}

export async function insertAudienceQuestions(userId: string, extracted: GraphExtraction['audienceQuestions']) {
  if (!extracted.length) return []
  return db.insert(audienceQuestions)
    .values(extracted.map(q => ({
      userId,
      question:  q.question,
      painPoint: q.painPoint,
      segments:  q.segments,
      resolved:  q.resolved,
    })))
    .returning()
}

// ── Tag content items with topic/hook arrays (JSONB update) ────────────────

export async function tagContentItems(
  userId: string,
  contentTags: GraphExtraction['contentTags'],
  indexToExternalId: Map<number, string>
) {
  await Promise.all(
    contentTags.map(tag => {
      const externalId = indexToExternalId.get(tag.index)
      if (!externalId) return
      return db.update(contentItems)
        .set({ topics: tag.topics, hooks: tag.hooks })
        .where(sql`${contentItems.userId} = ${userId} AND ${contentItems.externalId} = ${externalId}`)
    })
  )
}

// ── Read queries ───────────────────────────────────────────────────────────

export async function getTopics(userId: string, limit = 50) {
  return db.select().from(topics)
    .where(eq(topics.userId, userId))
    .orderBy(desc(topics.confidence))
    .limit(limit)
}

export async function getHooks(userId: string, limit = 30) {
  return db.select().from(hooks)
    .where(eq(hooks.userId, userId))
    .orderBy(desc(hooks.confidence))
    .limit(limit)
}

export async function getAudienceSegments(userId: string) {
  return db.select().from(audienceSegments).where(eq(audienceSegments.userId, userId))
}

export async function getOpenQuestions(userId: string, limit = 20) {
  return db.select().from(audienceQuestions)
    .where(eq(audienceQuestions.userId, userId))
    .orderBy(desc(audienceQuestions.createdAt))
    .limit(limit)
}

export async function getGraphEntityCount(userId: string) {
  const [t, h, s, q] = await Promise.all([
    db.select({ n: count() }).from(topics).where(eq(topics.userId, userId)),
    db.select({ n: count() }).from(hooks).where(eq(hooks.userId, userId)),
    db.select({ n: count() }).from(audienceSegments).where(eq(audienceSegments.userId, userId)),
    db.select({ n: count() }).from(audienceQuestions).where(eq(audienceQuestions.userId, userId)),
  ])
  return (t[0]?.n ?? 0) + (h[0]?.n ?? 0) + (s[0]?.n ?? 0) + (q[0]?.n ?? 0)
}
