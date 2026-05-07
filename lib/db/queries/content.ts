import { db, contentItems } from '@/lib/db'
import { eq, desc, count } from 'drizzle-orm'

export async function getContentItems(userId: string, limit = 20) {
  return db.select()
    .from(contentItems)
    .where(eq(contentItems.userId, userId))
    .orderBy(desc(contentItems.publishedAt))
    .limit(limit)
}

export async function getContentCount(userId: string) {
  const [row] = await db.select({ count: count() })
    .from(contentItems)
    .where(eq(contentItems.userId, userId))
  return row?.count ?? 0
}

export async function insertContentItems(
  items: typeof contentItems.$inferInsert[]
) {
  if (!items.length) return []
  return db.insert(contentItems).values(items).onConflictDoNothing().returning()
}
