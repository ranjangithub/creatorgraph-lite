import { db, memoryEntries } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { getGraphEntityCount } from './graph'

export async function getMemoryCount(userId: string) {
  return getGraphEntityCount(userId)
}

// Legacy — kept for any existing data imported before the graph migration.
export async function getLegacyMemoryEntries(userId: string, limit = 50) {
  return db.select()
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId))
    .orderBy(desc(memoryEntries.createdAt))
    .limit(limit)
}

export async function insertMemoryEntries(
  entries: typeof memoryEntries.$inferInsert[]
) {
  if (!entries.length) return []
  return db.insert(memoryEntries).values(entries).returning()
}
