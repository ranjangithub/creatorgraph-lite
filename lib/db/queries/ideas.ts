import { db, ideas } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'

export async function getIdeasForUser(userId: string, limit = 20) {
  return db.select()
    .from(ideas)
    .where(eq(ideas.userId, userId))
    .orderBy(desc(ideas.suggestedAt))
    .limit(limit)
}

export async function getTodayIdeas(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  return db.select()
    .from(ideas)
    .where(eq(ideas.userId, userId))
    .orderBy(desc(ideas.suggestedAt))
    .limit(10)
}

export async function updateIdeaStatus(
  ideaId: string,
  userId: string,
  status: 'accepted' | 'rejected',
  rejectionReason?: string
) {
  const [updated] = await db.update(ideas)
    .set({ status, rejectionReason: rejectionReason ?? null, actedAt: new Date() })
    .where(eq(ideas.id, ideaId))
    .returning()
  return updated
}

export async function insertIdea(data: typeof ideas.$inferInsert) {
  const [idea] = await db.insert(ideas).values(data).returning()
  return idea
}
