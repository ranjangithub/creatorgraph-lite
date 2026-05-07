import { db, memoryEntries } from '@/lib/db'
import { eq, desc, count } from 'drizzle-orm'

export async function getMemoryEntries(userId: string, limit = 50) {
  return db.select()
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId))
    .orderBy(desc(memoryEntries.createdAt))
    .limit(limit)
}

export async function getMemoryCount(userId: string) {
  const [row] = await db.select({ count: count() })
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId))
  return row?.count ?? 0
}

export async function insertMemoryEntries(
  entries: typeof memoryEntries.$inferInsert[]
) {
  if (!entries.length) return []
  return db.insert(memoryEntries).values(entries).returning()
}
