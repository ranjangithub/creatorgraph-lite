import { NextResponse } from 'next/server'
import { stripe }       from '@/lib/stripe/client'

export const runtime = 'nodejs'

const COUPON_ID      = process.env.STRIPE_EARLY_BIRD_COUPON_ID ?? ''
const EARLY_BIRD_MAX = parseInt(process.env.EARLY_BIRD_TOTAL ?? '100', 10)

export async function GET() {
  if (!COUPON_ID || COUPON_ID.includes('placeholder')) {
    return NextResponse.json({ active: false, remaining: EARLY_BIRD_MAX, total: EARLY_BIRD_MAX })
  }

  try {
    const coupon    = await stripe.coupons.retrieve(COUPON_ID)
    const redeemed  = coupon.times_redeemed ?? 0
    const maxR      = coupon.max_redemptions ?? EARLY_BIRD_MAX
    const remaining = Math.max(0, maxR - redeemed)
    const active    = !!(coupon.valid && remaining > 0)

    return NextResponse.json({ active, remaining, total: maxR, redeemed })
  } catch {
    return NextResponse.json({ active: false, remaining: EARLY_BIRD_MAX, total: EARLY_BIRD_MAX })
  }
}
