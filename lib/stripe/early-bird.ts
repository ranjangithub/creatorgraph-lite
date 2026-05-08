import { stripe } from './client'

export interface EarlyBirdStatus {
  active:        boolean  // Stripe coupon valid and has redemptions left
  displayActive: boolean  // Show promotion UI (always true unless EARLY_BIRD_DISPLAY=false)
  remaining:     number
  total:         number
  redeemed:      number
}

const COUPON_ID      = process.env.STRIPE_EARLY_BIRD_COUPON_ID ?? ''
const EARLY_BIRD_MAX = parseInt(process.env.EARLY_BIRD_TOTAL ?? '100', 10)
const DISPLAY        = process.env.EARLY_BIRD_DISPLAY !== 'false'

export async function getEarlyBirdStatus(): Promise<EarlyBirdStatus> {
  if (!COUPON_ID || COUPON_ID.includes('placeholder')) {
    // No real coupon yet — show promotional UI but discount won't apply at checkout
    return { active: false, displayActive: DISPLAY, remaining: EARLY_BIRD_MAX, total: EARLY_BIRD_MAX, redeemed: 0 }
  }
  try {
    const coupon    = await stripe.coupons.retrieve(COUPON_ID)
    const redeemed  = coupon.times_redeemed ?? 0
    const maxR      = coupon.max_redemptions ?? EARLY_BIRD_MAX
    const remaining = Math.max(0, maxR - redeemed)
    const active    = !!(coupon.valid && remaining > 0)
    return { active, displayActive: DISPLAY && active, remaining, total: maxR, redeemed }
  } catch {
    return { active: false, displayActive: DISPLAY, remaining: EARLY_BIRD_MAX, total: EARLY_BIRD_MAX, redeemed: 0 }
  }
}
