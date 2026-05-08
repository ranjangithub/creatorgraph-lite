import { NextResponse }      from 'next/server'
import { getOrCreateDbUser } from '@/lib/auth'
import { getSubscription, getLLMSettings } from '@/lib/db/queries/users'
import { TIER_CONFIGS, getAILimit }  from '@/lib/stripe/config'
import type { SubscriptionTier }     from '@/lib/stripe/config'

export async function GET() {
  try {
    const user = await getOrCreateDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [sub, llm] = await Promise.all([
      getSubscription(user.id),
      getLLMSettings(user.id),
    ])

    const tier      = (sub?.subscriptionTier ?? 'free') as SubscriptionTier
    const isActive  = !sub?.subscriptionStatus ||
                      sub.subscriptionStatus === 'active' ||
                      sub.subscriptionStatus === 'trialing'
    const hasOwnKey = !!(llm?.llmApiKey && llm.llmProvider !== 'app')
    const limit     = isActive ? getAILimit(tier, hasOwnKey) : 20
    const config    = TIER_CONFIGS[tier]

    return NextResponse.json({
      tier,
      status:          sub?.subscriptionStatus ?? null,
      isActive,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      hasStripeAccount: !!sub?.stripeCustomerId,
      monthlyUsage:    llm?.monthlyUsage ?? 0,
      aiLimit:         limit === Infinity ? null : limit,  // null = unlimited
      tierConfig:      {
        name:          config.name,
        aiGenerations: config.aiGenerations === Infinity ? null : config.aiGenerations,
        byokUnlocked:  config.byokUnlocked,
        platforms:     config.platforms === Infinity ? null : config.platforms,
        promptVault:   config.promptVault,
        hookAnalytics: config.hookAnalytics,
        teamSeats:     config.teamSeats === Infinity ? null : config.teamSeats,
      },
    })
  } catch (err) {
    console.error('[GET /api/subscription]', err)
    return NextResponse.json({ error: 'Failed to load subscription' }, { status: 500 })
  }
}
