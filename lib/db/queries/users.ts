import { db, users } from '@/lib/db'
import { eq, sql } from 'drizzle-orm'
import type { LLMProvider } from '@/lib/ai/types'

export async function getUserByClerkId(clerkId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  return user ?? null
}

export async function createUser(data: { clerkId: string; email: string; name?: string; imageUrl?: string }) {
  const [user] = await db.insert(users).values(data).returning()
  return user
}

export async function getLLMSettings(userId: string) {
  const [user] = await db
    .select({
      llmProvider:   users.llmProvider,
      llmApiKey:     users.llmApiKey,
      llmModel:      users.llmModel,
      monthlyUsage:  users.monthlyUsage,
      usageResetAt:  users.usageResetAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return user ?? null
}

export async function saveLLMSettings(
  userId: string,
  provider: LLMProvider,
  encryptedKey: string | null,
  model: string | null,
) {
  await db
    .update(users)
    .set({
      llmProvider: provider,
      llmApiKey:   encryptedKey,
      llmModel:    model,
      updatedAt:   new Date(),
    })
    .where(eq(users.id, userId))
}

export async function incrementUsage(userId: string): Promise<number> {
  const [updated] = await db
    .update(users)
    .set({
      monthlyUsage: sql`${users.monthlyUsage} + 1`,
      updatedAt:    new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ monthlyUsage: users.monthlyUsage })
  return updated?.monthlyUsage ?? 0
}

export async function resetUsageIfNewMonth(userId: string): Promise<void> {
  const [user] = await db
    .select({ usageResetAt: users.usageResetAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) return

  const now = new Date()
  const lastReset = user.usageResetAt ? new Date(user.usageResetAt) : null
  const needsReset =
    !lastReset ||
    lastReset.getFullYear() !== now.getFullYear() ||
    lastReset.getMonth() !== now.getMonth()

  if (needsReset) {
    await db
      .update(users)
      .set({ monthlyUsage: 0, usageResetAt: now, updatedAt: now })
      .where(eq(users.id, userId))
  }
}
