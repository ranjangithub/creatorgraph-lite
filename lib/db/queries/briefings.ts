import { db, briefings } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'

export async function getTodayBriefing(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  const [briefing] = await db.select()
    .from(briefings)
    .where(eq(briefings.userId, userId))
    .orderBy(desc(briefings.createdAt))
    .limit(1)
  return briefing?.date === today ? briefing : null
}

export async function getBriefingHistory(userId: string, limit = 7) {
  return db.select()
    .from(briefings)
    .where(eq(briefings.userId, userId))
    .orderBy(desc(briefings.createdAt))
    .limit(limit)
}

export async function insertBriefing(data: typeof briefings.$inferInsert) {
  const [briefing] = await db.insert(briefings).values(data).returning()
  return briefing
}
