import { MOCK_CLERK_ID, MOCK_USER_NAME, MOCK_USER_EMAIL } from '@/lib/mock/fixtures'

export const MOCK_AUTH = process.env.MOCK_AUTH === 'true'

// Server-side auth — use this in pages and API routes instead of auth() directly.
// In mock mode returns a hardcoded user; in production delegates to Clerk.

export async function getServerAuth(): Promise<{ clerkId: string | null }> {
  if (MOCK_AUTH) return { clerkId: MOCK_CLERK_ID }
  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = await auth()
  return { clerkId: userId ?? null }
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
