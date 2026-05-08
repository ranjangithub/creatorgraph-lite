// ── Tier definitions ────────────────────────────────────────────────────────
// Single source of truth for what each subscription tier gets.
// Price IDs come from environment variables so they can differ between
// test and production Stripe accounts without code changes.

export type SubscriptionTier = 'free' | 'creator' | 'creator_pro' | 'enterprise'

export interface TierConfig {
  id:              SubscriptionTier
  name:            string
  monthlyPrice:    number          // USD cents
  annualPrice:     number          // USD cents (per month, billed annually)
  monthlyPriceId:  string | null   // Stripe Price ID
  annualPriceId:   string | null   // Stripe Price ID
  aiGenerations:   number          // per month; Infinity = unlimited
  byokUnlocked:    boolean         // can bring own API key
  platforms:       number          // max platforms; Infinity = all
  promptVault:     boolean
  hookAnalytics:   boolean
  teamSeats:       number          // Infinity = unlimited (enterprise)
  description:     string
  highlight:       boolean         // show "Most popular" badge
}

export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id:             'free',
    name:           'Free',
    monthlyPrice:   0,
    annualPrice:    0,
    monthlyPriceId: null,
    annualPriceId:  null,
    aiGenerations:  20,
    byokUnlocked:   false,
    platforms:      1,
    promptVault:    false,
    hookAnalytics:  false,
    teamSeats:      1,
    description:    'Get started. See what your content is made of.',
    highlight:      false,
  },
  creator: {
    id:             'creator',
    name:           'Creator',
    monthlyPrice:   2900,  // $29
    annualPrice:    2417,  // $29/mo × 10 months = $290/yr → ~$24.17/mo
    monthlyPriceId: process.env.STRIPE_CREATOR_MONTHLY_PRICE_ID ?? '',
    annualPriceId:  process.env.STRIPE_CREATOR_ANNUAL_PRICE_ID ?? '',
    aiGenerations:  150,
    byokUnlocked:   true,
    platforms:      3,
    promptVault:    true,
    hookAnalytics:  true,
    teamSeats:      1,
    description:    'For creators who post consistently across platforms.',
    highlight:      true,
  },
  creator_pro: {
    id:             'creator_pro',
    name:           'Creator Pro',
    monthlyPrice:   5900,  // $59
    annualPrice:    4917,  // $59/mo × 10 months = $590/yr → ~$49.17/mo
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
    annualPriceId:  process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? '',
    aiGenerations:  500,
    byokUnlocked:   true,
    platforms:      Infinity,
    promptVault:    true,
    hookAnalytics:  true,
    teamSeats:      1,
    description:    'For daily creators, agencies, and power users.',
    highlight:      false,
  },
  enterprise: {
    id:             'enterprise',
    name:           'Enterprise',
    monthlyPrice:   24900, // $249 base
    annualPrice:    20750, // ~$249 × 10 = $2490/yr
    monthlyPriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ?? '',
    annualPriceId:  process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID ?? '',
    aiGenerations:  Infinity,
    byokUnlocked:   true,
    platforms:      Infinity,
    promptVault:    true,
    hookAnalytics:  true,
    teamSeats:      5,     // base; $49/seat beyond
    description:    'For brands, teams, and agencies managing multiple voices.',
    highlight:      false,
  },
}

export const ALL_TIERS = Object.values(TIER_CONFIGS)

// Resolve a Stripe price ID back to a tier
export function tierFromPriceId(priceId: string): SubscriptionTier | null {
  for (const tier of ALL_TIERS) {
    if (tier.monthlyPriceId === priceId || tier.annualPriceId === priceId) {
      return tier.id
    }
  }
  return null
}

// How many AI generations can this user make?
// BYOK with own key = unlimited regardless of tier.
export function getAILimit(tier: SubscriptionTier, hasOwnKey: boolean): number {
  if (hasOwnKey && TIER_CONFIGS[tier].byokUnlocked) return Infinity
  return TIER_CONFIGS[tier].aiGenerations
}

// Feature gate checks
export function canUseBYOK(tier: SubscriptionTier): boolean {
  return TIER_CONFIGS[tier].byokUnlocked
}

export function canAccessPlatform(tier: SubscriptionTier, platformIndex: number): boolean {
  const limit = TIER_CONFIGS[tier].platforms
  return limit === Infinity || platformIndex < limit
}
