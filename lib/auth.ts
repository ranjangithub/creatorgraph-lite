import { MOCK_CLERK_ID, MOCK_USER_NAME as _MOCK_USER_NAME, MOCK_USER_EMAIL } from '@/lib/mock/fixtures'

export const MOCK_AUTH      = process.env.MOCK_AUTH === 'true'
export const MOCK_USER_NAME = _MOCK_USER_NAME

// Server-side auth — use this in pages and API routes instead of auth() directly.
// In mock mode returns a hardcoded user; in production delegates to Clerk.

export async function getServerAuth(): Promise<{ clerkId: string | null }> {
  if (MOCK_AUTH) return { clerkId: MOCK_CLERK_ID }
  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = await auth()
  return { clerkId: userId ?? null }
}

// Returns the local DB user, creating it on first sign-in if it doesn't exist yet.
// Use this in dashboard pages instead of getUserByClerkId + redirect('/sign-in').
export async function getOrCreateDbUser() {
  const { clerkId } = await getServerAuth()
  if (!clerkId) return null

  const { getUserByClerkId, createUser } = await import('@/lib/db/queries/users')
  const existing = await getUserByClerkId(clerkId)
  if (existing) return existing

  // First sign-in: pull name/email from Clerk and create the local record.
  const clerkUser = await getCurrentUser()
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? ''
  const name  = clerkUser?.fullName ?? ''
  return createUser({ clerkId, email, name })
}

// currentUser() equivalent — for settings page / profile display.
export async function getCurrentUser() {
  if (MOCK_AUTH) {
    return {
      fullName:              MOCK_USER_NAME,
      primaryEmailAddress:   { emailAddress: MOCK_USER_EMAIL },
    }
  }
  const { currentUser } = await import('@clerk/nextjs/server')
  return currentUser()
}
