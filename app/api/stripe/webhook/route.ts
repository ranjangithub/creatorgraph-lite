import { NextResponse }    from 'next/server'
import Stripe              from 'stripe'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe/client'
import { tierFromPriceId } from '@/lib/stripe/config'
import {
  upsertSubscriptionByStripeCustomerId,
  upsertSubscription,
} from '@/lib/db/queries/users'

export const runtime = 'nodejs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeEvent = any

export async function POST(req: Request) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: StripeEvent
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[Stripe webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    await handleStripeEvent(event)
  } catch (err) {
    console.error(`[Stripe webhook] error handling ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function getSubscriptionData(subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const item     = sub.items?.data?.[0]
  const priceId  = item?.price?.id ?? ''
  const tier     = tierFromPriceId(priceId) ?? 'free'
  // Handle both camelCase (v22+) and snake_case (older) field names
  const periodEnd = new Date(
    ((sub as { currentPeriodEnd?: number; current_period_end?: number }).currentPeriodEnd
    ?? (sub as { currentPeriodEnd?: number; current_period_end?: number }).current_period_end
    ?? 0) * 1000
  )
  return { sub, priceId, tier, periodEnd }
}

async function handleStripeEvent(event: StripeEvent) {
  const data = event.data?.object ?? {}
  const customerId = (data.customer ?? '') as string

  switch (event.type) {

    case 'checkout.session.completed': {
      if (data.mode !== 'subscription' || !data.subscription) break
      const { sub, priceId, tier, periodEnd } = await getSubscriptionData(data.subscription)
      const userId = data.metadata?.userId
                  ?? sub.metadata?.userId

      const payload = {
        stripeCustomerId:     customerId,
        stripeSubscriptionId: sub.id,
        stripePriceId:        priceId,
        subscriptionStatus:   sub.status,
        subscriptionTier:     tier,
        currentPeriodEnd:     periodEnd,
      }

      if (userId) {
        await upsertSubscription(userId, payload)
      } else {
        await upsertSubscriptionByStripeCustomerId(customerId, {
          stripeSubscriptionId: sub.id,
          stripePriceId:        priceId,
          subscriptionStatus:   sub.status,
          subscriptionTier:     tier,
          currentPeriodEnd:     periodEnd,
        })
      }
      break
    }

    case 'customer.subscription.updated': {
      const item     = data.items?.data?.[0]
      const priceId  = item?.price?.id ?? ''
      const tier     = tierFromPriceId(priceId) ?? 'free'
      const periodEnd = new Date(
        (data.currentPeriodEnd ?? data.current_period_end ?? 0) * 1000
      )
      const isActive = data.status === 'active' || data.status === 'trialing'
      await upsertSubscriptionByStripeCustomerId(customerId, {
        stripeSubscriptionId: data.id,
        stripePriceId:        priceId,
        subscriptionStatus:   data.status,
        subscriptionTier:     isActive ? tier : 'free',
        currentPeriodEnd:     periodEnd,
      })
      break
    }

    case 'customer.subscription.deleted': {
      await upsertSubscriptionByStripeCustomerId(customerId, {
        subscriptionStatus: 'canceled',
        subscriptionTier:   'free',
        currentPeriodEnd:   null,
      })
      break
    }

    case 'invoice.payment_failed': {
      await upsertSubscriptionByStripeCustomerId(customerId, {
        subscriptionStatus: 'past_due',
      })
      break
    }

    case 'invoice.payment_succeeded': {
      const subscriptionId = data.subscription ?? data.subscriptionId
      if (!subscriptionId) break
      const { priceId, tier, periodEnd } = await getSubscriptionData(subscriptionId)
      await upsertSubscriptionByStripeCustomerId(customerId, {
        subscriptionStatus: 'active',
        subscriptionTier:   tier,
        stripePriceId:      priceId,
        currentPeriodEnd:   periodEnd,
      })
      break
    }

    default:
      break
  }
}
