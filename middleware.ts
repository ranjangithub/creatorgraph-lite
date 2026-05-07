import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

export default async function middleware(req: NextRequest, event: unknown) {
  // In mock mode every route is accessible — auth is handled by getServerAuth()
  if (process.env.MOCK_AUTH === 'true') return NextResponse.next()

  return clerkMiddleware(async (auth, r) => {
    if (!isPublicRoute(r)) await auth.protect()
  })(req, event as Parameters<ReturnType<typeof clerkMiddleware>>[1])
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
