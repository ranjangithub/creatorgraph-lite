import { stripe } from './client'

export interface EarlyBirdStatus {
  active:    boolean
  remaining: number
  total:     number
  redeemed:  number
}

const COUPON_ID      = process.env.STRIPE_EARLY_BIRD_COUPON_ID ?? ''
const EARLY_BIRD_MAX = parseInt(process.env.EARLY_BIRD_TOTAL ?? '100', 10)

export async function getEarlyBirdStatus(): Promise<EarlyBirdStatus> {
  if (!COUPON_ID || COUPON_ID.includes('placeholder')) {
    return { active: false, remaining: EARLY_BIRD_MAX, total: EARLY_BIRD_MAX, redeemed: 0 }
  }
  try {
    const coupon    = await stripe.coupons.retrieve(COUPON_ID)
    const redeemed  = coupon.times_redeemed ?? 0
    const maxR      = coupon.max_redemptions ?? EARLY_BIRD_MAX
    const remaining = Math.max(0, maxR - redeemed)
    const active    = !!(coupon.valid && remaining > 0)
    return { active, remaining, total: maxR, redeemed }
  } catch {
    return { active: false, remaining: EARLY_BIRD_MAX, total: EARLY_BIRD_MAX, redeemed: 0 }
  }
}
