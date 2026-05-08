import { NextResponse }        from 'next/server'
import { getOrCreateDbUser }   from '@/lib/auth'
import { stripe }              from '@/lib/stripe/client'
import { TIER_CONFIGS }        from '@/lib/stripe/config'
import { getSubscription, upsertSubscription } from '@/lib/db/queries/users'
import type { SubscriptionTier } from '@/lib/stripe/config'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST(req: Request) {
  try {
    const user = await getOrCreateDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      tier:     SubscriptionTier
      interval: 'month' | 'year'
    }

    const { tier, interval } = body
    const tierConfig = TIER_CONFIGS[tier]

    if (!tierConfig || tier === 'free') {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const priceId = interval === 'year'
      ? tierConfig.annualPriceId
      : tierConfig.monthlyPriceId

    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 400 })
    }

    // Get or create Stripe customer
    const existing = await getSubscription(user.id)
    let customerId = existing?.stripeCustomerId ?? null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    user.email,
        name:     user.name ?? undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await upsertSubscription(user.id, { stripeCustomerId: customerId })
    }

    const earlyBirdCouponId = process.env.STRIPE_EARLY_BIRD_COUPON_ID

    const baseParams = {
      customer:             customerId,
      mode:                 'subscription' as const,
      payment_method_types: ['card'] as ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/settings?upgraded=true`,
      cancel_url:  `${APP_URL}/pricing?canceled=true`,
      subscription_data: { metadata: { userId: user.id, tier } },
    }

    let session
    if (earlyBirdCouponId && !earlyBirdCouponId.includes('placeholder')) {
      try {
        session = await stripe.checkout.sessions.create({
          ...baseParams,
          discounts: [{ coupon: earlyBirdCouponId }],
        })
      } catch {
        // Coupon exhausted or invalid — fall back to no discount
        session = await stripe.checkout.sessions.create({
          ...baseParams,
          allow_promotion_codes: true,
        })
      }
    } else {
      session = await stripe.checkout.sessions.create({
        ...baseParams,
        allow_promotion_codes: true,
      })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[POST /api/stripe/checkout]', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
