import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function getUserByClerkId(clerkId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  return user ?? null
}

export async function createUser(data: { clerkId: string; email: string; name?: string; imageUrl?: string }) {
  const [user] = await db.insert(users).values(data).returning()
  return user
}
