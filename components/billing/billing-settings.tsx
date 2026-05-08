'use client'

import { useState, useEffect } from 'react'
import { CreditCard, ExternalLink, Zap, Star, Building2, CheckCircle2 } from 'lucide-react'
import { TIER_CONFIGS } from '@/lib/stripe/config'
import type { SubscriptionTier } from '@/lib/stripe/config'

interface SubState {
  tier:             SubscriptionTier
  status:           string | null
  isActive:         boolean
  currentPeriodEnd: string | null
  hasStripeAccount: boolean
  monthlyUsage:     number
  aiLimit:          number | null  // null = unlimited
  tierConfig: {
    name:          string
    aiGenerations: number | null
    byokUnlocked:  boolean
    platforms:     number | null
    promptVault:   boolean
    hookAnalytics: boolean
    teamSeats:     number | null
  }
}

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free:        '#94a3b8',
  creator:     '#4f46e5',
  creator_pro: '#7c3aed',
  enterprise:  '#0f0c29',
}

const TIER_ICONS: Record<SubscriptionTier, React.ReactNode> = {
  free:        <Zap style={{ width: 16, height: 16 }} />,
  creator:     <Star style={{ width: 16, height: 16 }} />,
  creator_pro: <Star style={{ width: 16, height: 16 }} />,
  enterprise:  <Building2 style={{ width: 16, height: 16 }} />,
}

export function BillingSettings({ showUpgradeSuccess }: { showUpgradeSuccess?: boolean }) {
  const [state, setState]   = useState<SubState | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    fetch('/api/subscription')
      .then(r => r.json())
      .then(setState)
  }, [])

  async function openPortal() {
    setLoading(true)
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  async function startCheckout(tier: SubscriptionTier) {
    setCheckoutLoading(true)
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tier, interval: 'month' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (!state) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 22px', borderBottom: '1px solid #f0f4ff', background: '#fafbff' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>Billing</div>
        </div>
        <div style={{ padding: 22 }}>
          <div style={{ height: 60, background: '#f0f4ff', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
        </div>
      </div>
    )
  }

  const tierColor  = TIER_COLORS[state.tier]
  const tierConfig = TIER_CONFIGS[state.tier]
  const usagePct   = state.aiLimit ? Math.min(100, (state.monthlyUsage / state.aiLimit) * 100) : 0
  const remaining  = state.aiLimit ? state.aiLimit - state.monthlyUsage : null
  const periodEnd  = state.currentPeriodEnd
    ? new Date(state.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 22px', borderBottom: '1px solid #f0f4ff', background: '#fafbff', display: 'flex', alignItems: 'center', gap: 8 }}>
        <CreditCard style={{ width: 15, height: 15, color: '#6366f1' }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>Billing</div>
      </div>

      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Upgrade success */}
        {showUpgradeSuccess && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
            <CheckCircle2 style={{ width: 18, height: 18, color: '#16a34a', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>
              Your plan has been upgraded successfully.
            </span>
          </div>
        )}

        {/* Current plan badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: `${tierColor}15`, color: tierColor, fontSize: 13, fontWeight: 700 }}>
                {TIER_ICONS[state.tier]}
                {state.tierConfig.name}
              </div>
              {state.status && state.status !== 'active' && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: state.status === 'past_due' ? '#fef3c7' : '#fee2e2',
                  color:      state.status === 'past_due' ? '#92400e' : '#991b1b',
                }}>
                  {state.status.replace('_', ' ')}
                </span>
              )}
            </div>
            {periodEnd && (
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {state.status === 'canceled' ? 'Access until' : 'Renews'} {periodEnd}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {state.hasStripeAccount && (
              <button onClick={openPortal} disabled={loading} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 8, border: '1px solid #e0e7ff', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#4b5563', cursor: 'pointer',
              }}>
                <ExternalLink style={{ width: 13, height: 13 }} />
                {loading ? 'Opening...' : 'Manage billing'}
              </button>
            )}
            {state.tier === 'free' && (
              <button onClick={() => window.location.href = '/pricing'} style={{
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: '#4f46e5', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                Upgrade
              </button>
            )}
          </div>
        </div>

        {/* AI usage meter */}
        <div style={{ padding: '16px', background: '#fafbff', borderRadius: 10, border: '1px solid #f0f4ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>AI usage this month</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              {state.aiLimit === null
                ? `${state.monthlyUsage} used — unlimited`
                : `${state.monthlyUsage} / ${state.aiLimit}`
              }
            </span>
          </div>
          {state.aiLimit !== null && (
            <>
              <div style={{ height: 6, background: '#e0e7ff', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width:  `${usagePct}%`,
                  background: usagePct >= 90 ? '#ef4444' : usagePct >= 70 ? '#f59e0b' : '#4f46e5',
                  borderRadius: 3,
                  transition: 'width 0.3s',
                }} />
              </div>
              {remaining !== null && remaining <= 5 && remaining > 0 && (
                <p style={{ fontSize: 12, color: '#d97706', marginTop: 6, fontWeight: 600 }}>
                  {remaining} generation{remaining === 1 ? '' : 's'} left this month.
                  {' '}<a href="/pricing" style={{ color: '#4f46e5', textDecoration: 'underline' }}>Upgrade for more.</a>
                </p>
              )}
              {remaining !== null && remaining <= 0 && (
                <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6, fontWeight: 700 }}>
                  Monthly limit reached.{' '}
                  <a href="/pricing" style={{ color: '#4f46e5', textDecoration: 'underline' }}>Upgrade to continue.</a>
                </p>
              )}
            </>
          )}
        </div>

        {/* Feature list for current tier */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 16px' }}>
          {[
            { label: 'AI generations', value: state.aiLimit === null ? 'Unlimited' : `${state.aiLimit}/month` },
            { label: 'Platforms',      value: state.tierConfig.platforms === null ? 'All' : `${state.tierConfig.platforms}` },
            { label: 'BYOK',           value: state.tierConfig.byokUnlocked ? 'Unlocked' : 'Locked' },
            { label: 'Prompt Vault',   value: state.tierConfig.promptVault ? 'Yes' : 'No' },
            { label: 'Hook analytics', value: state.tierConfig.hookAnalytics ? 'Yes' : 'No' },
            { label: 'Team seats',     value: state.tierConfig.teamSeats === null ? 'Unlimited' : `${state.tierConfig.teamSeats}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ fontSize: 12 }}>
              <span style={{ color: '#94a3b8', marginRight: 4 }}>{label}:</span>
              <span style={{ fontWeight: 700, color: '#374151' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Upgrade nudge for free/creator */}
        {state.tier === 'free' && (
          <div style={{ padding: '16px', background: '#f0f4ff', borderRadius: 10, border: '1px solid #e0e7ff' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29', marginBottom: 6 }}>
              Upgrade to Creator — $29/month
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
              150 AI generations, 3 platforms, full prompt vault, BYOK for unlimited usage.
            </div>
            <button
              onClick={() => startCheckout('creator')}
              disabled={checkoutLoading}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#4f46e5', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {checkoutLoading ? 'Loading...' : 'Upgrade to Creator'}
            </button>
          </div>
        )}
        {state.tier === 'creator' && (
          <div style={{ padding: '16px', background: '#faf5ff', borderRadius: 10, border: '1px solid #e9d5ff' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29', marginBottom: 6 }}>
              Upgrade to Creator Pro — $59/month
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
              500 AI generations, all platforms, draft history, and usage analytics.
            </div>
            <button
              onClick={() => startCheckout('creator_pro')}
              disabled={checkoutLoading}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#7c3aed', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {checkoutLoading ? 'Loading...' : 'Upgrade to Creator Pro'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
