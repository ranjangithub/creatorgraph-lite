import { NextResponse }        from 'next/server'
import { getEarlyBirdStatus } from '@/lib/stripe/early-bird'

export const runtime = 'nodejs'

export async function GET() {
  const status = await getEarlyBirdStatus()
  return NextResponse.json(status)
}
