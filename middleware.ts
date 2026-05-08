import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/stripe/webhook',
])

const clerk = clerkMiddleware(async (auth, r) => {
  if (!isPublicRoute(r)) await auth.protect()
})

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // In mock mode every route is accessible — auth is handled by getServerAuth()
  if (process.env.MOCK_AUTH === 'true') return NextResponse.next()
  return clerk(req, event)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
