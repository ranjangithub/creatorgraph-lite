import { db, users, ideas, postPerformance, hookPerformance, nicheBenchmarks, topics } from '@/lib/db'
import { eq, desc, and, isNull, gte, sql } from 'drizzle-orm'
import { getPlatformAdapter } from '@/lib/platforms/registry'
import type { Platform } from '@/lib/platforms/types'

// ── Post Performance ──────────────────────────────────────────────────────

export async function recordPostPerformance(data: {
  userId:      string
  ideaId:      string
  platform:    Platform
  likes:       number
  comments:    number
  shares:      number
  saves:       number
  impressions: number
  hookType:    string | null
  orgId?:      string
}) {
  const adapter = getPlatformAdapter(data.platform)
  const engagementScore = adapter.normaliseEngagement({
    likes:       data.likes,
    comments:    data.comments,
    shares:      data.shares,
    saves:       data.saves,
    impressions: data.impressions,
  })

  const [row] = await db.insert(postPerformance).values({
    userId:          data.userId,
    orgId:           data.orgId,
    ideaId:          data.ideaId,
    platform:        data.platform,
    likes:           data.likes,
    comments:        data.comments,
    shares:          data.shares,
    saves:           data.saves,
    impressions:     data.impressions,
    engagementScore,
    hookType:        data.hookType,
  }).onConflictDoUpdate({
    target: postPerformance.ideaId,
    set: {
      likes: data.likes, comments: data.comments, shares: data.shares,
      saves: data.saves, impressions: data.impressions, engagementScore,
      hookType: data.hookType,
    },
  }).returning()
  return row
}

export async function getPostPerformance(userId: string, limit = 20) {
  return db.select().from(postPerformance)
    .where(eq(postPerformance.userId, userId))
    .orderBy(desc(postPerformance.publishedAt))
    .limit(limit)
}

// ── Hook Performance ──────────────────────────────────────────────────────

export async function getUserHookPerformance(userId: string, platform?: Platform) {
  const conditions = platform
    ? and(eq(hookPerformance.userId, userId), eq(hookPerformance.platform, platform))
    : eq(hookPerformance.userId, userId)

  return db.select().from(hookPerformance)
    .where(conditions)
    .orderBy(desc(hookPerformance.avgScore))
}

// ── Niche Benchmarks ──────────────────────────────────────────────────────

export async function getNicheBenchmark(niche: string, userTopics: string[], platform: Platform = 'linkedin') {
  const rows = await db.select().from(nicheBenchmarks)
    .where(and(eq(nicheBenchmarks.niche, niche), eq(nicheBenchmarks.platform, platform)))
    .orderBy(desc(nicheBenchmarks.creatorCount))

  return rows.map(r => ({
    ...r,
    userCovers: userTopics.some(t => t.toLowerCase() === r.topicName.toLowerCase()),
  }))
}

export async function updateUserNicheSettings(
  userId: string,
  niche: string,
  shareForBenchmark: boolean,
) {
  await db.update(users)
    .set({ niche, shareForBenchmark, updatedAt: new Date() })
    .where(eq(users.id, userId))
}

// ── Cron: refresh hook performance ────────────────────────────────────────
// Groups postPerformance by user + platform + hookType, upserts averages.

export async function cronRefreshHookPerformance() {
  const rows = await db.execute(sql`
    SELECT
      user_id,
      platform,
      hook_type,
      ROUND(AVG(engagement_score))::int  AS avg_score,
      COUNT(*)::int                       AS post_count
    FROM post_performance
    WHERE hook_type IS NOT NULL
    GROUP BY user_id, platform, hook_type
  `)

  for (const r of (rows as unknown) as { user_id: string; platform: string; hook_type: string; avg_score: number; post_count: number }[]) {
    await db.insert(hookPerformance).values({
      userId:    r.user_id,
      platform:  r.platform as Platform,
      hookType:  r.hook_type,
      avgScore:  r.avg_score,
      postCount: r.post_count,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [hookPerformance.userId, hookPerformance.platform, hookPerformance.hookType],
      set: { avgScore: r.avg_score, postCount: r.post_count, updatedAt: new Date() },
    })
  }

  return (rows as unknown[]).length
}

// ── Cron: refresh niche benchmarks ────────────────────────────────────────

export async function cronRefreshNicheBenchmarks() {
  const optedIn = await db.select({ id: users.id, niche: users.niche, accountType: users.accountType })
    .from(users)
    .where(and(eq(users.shareForBenchmark, true), sql`${users.niche} IS NOT NULL`))

  if (!optedIn.length) return 0

  const nicheMap = new Map<string, { userIds: string[]; accountType: string }>()
  for (const u of optedIn) {
    if (!u.niche) continue
    const key = `${u.niche}:::${u.accountType}`
    const entry = nicheMap.get(key) ?? { userIds: [], accountType: u.accountType }
    entry.userIds.push(u.id)
    nicheMap.set(key, entry)
  }

  let upserted = 0
  for (const [key, { userIds, accountType }] of nicheMap) {
    const niche = key.split(':::')[0]
    const rows = await db.execute(sql`
      SELECT name AS topic_name, COUNT(DISTINCT user_id)::int AS creator_count
      FROM topics
      WHERE user_id = ANY(${userIds})
      GROUP BY name
    `) as { topic_name: string; creator_count: number }[]

    for (const r of rows) {
      await db.insert(nicheBenchmarks).values({
        niche,
        topicName:    r.topic_name,
        platform:     'linkedin',
        accountType:  accountType as 'individual' | 'enterprise',
        creatorCount: r.creator_count,
        updatedAt:    new Date(),
      }).onConflictDoUpdate({
        target: [nicheBenchmarks.niche, nicheBenchmarks.topicName, nicheBenchmarks.platform, nicheBenchmarks.accountType],
        set: { creatorCount: r.creator_count, updatedAt: new Date() },
      })
      upserted++
    }
  }

  return upserted
}

// ── Cron: classify hook types + compute freshness ─────────────────────────

function classifyHookType(hook: string | null): string {
  if (!hook) return 'other'
  const h = hook.toLowerCase()
  if (h.includes('?'))                                          return 'question'
  if (/\d+%|\d+ of \d+|study|research|data/.test(h))           return 'statistic'
  if (/most people|conventional|think you|wrong about/.test(h)) return 'counterintuitive'
  if (/i was|back when|imagine|story|moment/.test(h))           return 'story'
  if (/\d+ ways|\d+ things|\d+ steps|list/.test(h))            return 'list'
  return 'bold_claim'
}

export async function cronEnrichIdeas() {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const noHookType = await db.select({ id: ideas.id, hook: ideas.hook })
    .from(ideas)
    .where(and(isNull(ideas.hookType), gte(ideas.suggestedAt, since)))

  for (const idea of noHookType) {
    await db.update(ideas)
      .set({ hookType: classifyHookType(idea.hook) })
      .where(eq(ideas.id, idea.id))
  }

  const noFreshness = await db.select({ id: ideas.id, repetitionRisk: ideas.repetitionRisk })
    .from(ideas)
    .where(and(isNull(ideas.freshnessScore), gte(ideas.suggestedAt, since)))

  for (const idea of noFreshness) {
    const risk  = (idea.repetitionRisk ?? '').toLowerCase()
    const score = risk.includes('repeat') ? 10 : risk.includes('sequel') ? 55 : 90
    await db.update(ideas)
      .set({ freshnessScore: score })
      .where(eq(ideas.id, idea.id))
  }

  return { hookTypes: noHookType.length, freshness: noFreshness.length }
}
