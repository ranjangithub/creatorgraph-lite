import { NextResponse }      from 'next/server'
import { getOrCreateDbUser } from '@/lib/auth'
import { stripe }            from '@/lib/stripe/client'
import { getSubscription }   from '@/lib/db/queries/users'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST() {
  try {
    const user = await getOrCreateDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sub = await getSubscription(user.id)
    if (!sub?.stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   sub.stripeCustomerId,
      return_url: `${APP_URL}/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[POST /api/stripe/portal]', err)
    return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500 })
  }
}
