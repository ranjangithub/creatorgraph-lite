'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, Star, Building2 } from 'lucide-react'
import { TIER_CONFIGS } from '@/lib/stripe/config'
import type { SubscriptionTier } from '@/lib/stripe/config'

const FEATURES: Record<SubscriptionTier, string[]> = {
  free: [
    '20 AI generations / month',
    '1 platform (LinkedIn)',
    '3 briefing ideas / day',
    'Knowledge graph (top 20 entries)',
    'Basic content import',
  ],
  creator: [
    '150 AI generations / month',
    'Bring your own API key (unlimited)',
    '3 platforms',
    'Full knowledge graph',
    'Full prompt vault — unlimited templates',
    'Hook performance analytics',
    'Niche benchmarking',
  ],
  creator_pro: [
    '500 AI generations / month',
    'Bring your own API key (unlimited)',
    'All platforms',
    'Everything in Creator',
    'Draft history + export',
    'Usage analytics dashboard',
    'Priority processing',
  ],
  enterprise: [
    'Unlimited AI generations',
    'Bring any API key (any provider)',
    'All platforms',
    'Multi-member teams (5 seats)',
    'Shared org knowledge graph',
    'Brand voice guidelines',
    'Company page support',
    'SSO-ready',
    'Dedicated support + SLA',
  ],
}

const TIER_ICONS: Record<SubscriptionTier, React.ReactNode> = {
  free:        <Zap style={{ width: 20, height: 20, color: '#94a3b8' }} />,
  creator:     <Star style={{ width: 20, height: 20, color: '#4f46e5' }} />,
  creator_pro: <Star style={{ width: 20, height: 20, color: '#7c3aed' }} />,
  enterprise:  <Building2 style={{ width: 20, height: 20, color: '#0f0c29' }} />,
}

const DISPLAY_TIERS: SubscriptionTier[] = ['free', 'creator', 'creator_pro']

function formatPrice(cents: number, annual: boolean): string {
  if (cents === 0) return '$0'
  const monthly = annual ? cents : cents
  return `$${Math.round(monthly / 100)}`
}

export function PricingPageClient() {
  const [annual, setAnnual]       = useState(false)
  const [loading, setLoading]     = useState<SubscriptionTier | null>(null)
  const router                    = useRouter()

  async function handleUpgrade(tier: SubscriptionTier) {
    if (tier === 'free') return
    setLoading(tier)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tier, interval: annual ? 'year' : 'month' }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Not signed in — redirect to sign-in
        if (res.status === 401) { router.push('/sign-in'); return }
        throw new Error(data.error)
      }
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafbff', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '72px 24px 40px' }}>
        <a href="/" style={{ display: 'inline-block', marginBottom: 32, textDecoration: 'none' }}>
          <span style={{ fontWeight: 900, fontSize: 18, color: '#4f46e5', letterSpacing: -0.5 }}>
            CreatorGraph <span style={{ color: '#94a3b8', fontWeight: 400 }}>Beta</span>
          </span>
        </a>
        <h1 style={{ fontSize: 42, fontWeight: 900, color: '#0f0c29', margin: '0 0 12px', letterSpacing: -1 }}>
          Simple pricing.
        </h1>
        <p style={{ fontSize: 18, color: '#6b7280', margin: '0 0 32px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          Start free and see what your content is made of. Upgrade when you need more.
        </p>

        {/* Annual toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e0e7ff', borderRadius: 999, padding: '6px 16px' }}>
          <button
            onClick={() => setAnnual(false)}
            style={{
              padding: '6px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: !annual ? '#4f46e5' : 'transparent',
              color: !annual ? '#fff' : '#6b7280', fontWeight: 600, fontSize: 14,
            }}
          >Monthly</button>
          <button
            onClick={() => setAnnual(true)}
            style={{
              padding: '6px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: annual ? '#4f46e5' : 'transparent',
              color: annual ? '#fff' : '#6b7280', fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            Annual
            <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Tier cards */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 64px', display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {DISPLAY_TIERS.map(tierId => {
          const tier    = TIER_CONFIGS[tierId]
          const price   = annual ? tier.annualPrice : tier.monthlyPrice
          const popular = tier.highlight

          return (
            <div key={tierId} style={{
              flex: '1 1 300px', maxWidth: 340,
              background:   '#fff',
              border:       popular ? '2px solid #4f46e5' : '1px solid #e0e7ff',
              borderRadius: 20,
              padding:      '32px 28px',
              position:     'relative',
              boxShadow:    popular ? '0 8px 32px rgba(79,70,229,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
            }}>

              {popular && (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: '#4f46e5', color: '#fff', fontSize: 12, fontWeight: 700,
                  padding: '4px 16px', borderRadius: 999, whiteSpace: 'nowrap',
                }}>
                  Most popular
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                {TIER_ICONS[tierId]}
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0f0c29' }}>{tier.name}</span>
              </div>

              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px', minHeight: 36 }}>
                {tier.description}
              </p>

              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: '#0f0c29' }}>
                  {formatPrice(price, annual)}
                </span>
                {price > 0 && (
                  <span style={{ fontSize: 14, color: '#94a3b8', marginLeft: 4 }}>
                    /mo{annual ? ', billed annually' : ''}
                  </span>
                )}
                {annual && price > 0 && (
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
                    ${Math.round(price * 12 / 100)}/year — save ${Math.round((tier.monthlyPrice - price) * 12 / 100)}
                  </div>
                )}
              </div>

              <button
                onClick={() => tierId === 'free' ? router.push('/sign-up') : handleUpgrade(tierId)}
                disabled={loading === tierId}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                  cursor: loading === tierId ? 'not-allowed' : 'pointer',
                  background: popular ? '#4f46e5' : tierId === 'free' ? '#f0f4ff' : '#0f0c29',
                  color: popular ? '#fff' : tierId === 'free' ? '#4f46e5' : '#fff',
                  fontWeight: 700, fontSize: 15, marginBottom: 24,
                  opacity: loading === tierId ? 0.7 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {loading === tierId ? 'Redirecting...' :
                  tierId === 'free' ? 'Start free' : `Get ${tier.name}`}
              </button>

              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FEATURES[tierId].map(feature => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#374151' }}>
                    <Check style={{ width: 16, height: 16, color: '#4f46e5', flexShrink: 0, marginTop: 1 }} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Enterprise CTA */}
      <div style={{ maxWidth: 1080, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)',
          borderRadius: 20, padding: '40px 48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 24,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Building2 style={{ width: 22, height: 22, color: '#a5b4fc' }} />
              <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>Enterprise</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', background: 'rgba(165,180,252,0.15)', padding: '2px 10px', borderRadius: 999 }}>
                from $249/month
              </span>
            </div>
            <p style={{ color: '#a5b4fc', fontSize: 14, margin: 0, maxWidth: 520 }}>
              Multi-member teams, shared brand voice, company page support, and dedicated support. Includes 5 seats — additional seats at $49/month.
            </p>
            <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {FEATURES.enterprise.slice(0, 5).map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#c7d2fe' }}>
                  <Check style={{ width: 14, height: 14, color: '#818cf8' }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => handleUpgrade('enterprise')}
            disabled={loading === 'enterprise'}
            style={{
              padding: '14px 32px', borderRadius: 12, border: 'none',
              background: '#fff', color: '#0f0c29',
              fontWeight: 800, fontSize: 15, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
              opacity: loading === 'enterprise' ? 0.7 : 1,
            }}
          >
            {loading === 'enterprise' ? 'Redirecting...' : 'Get Enterprise'}
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 640, margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f0c29', textAlign: 'center', marginBottom: 32 }}>
          Common questions
        </h2>
        {[
          {
            q: 'What counts as a "generation"?',
            a: 'Each briefing (daily content ideas) and each AI draft counts as one generation. Importing content also uses one generation per batch for knowledge graph extraction.',
          },
          {
            q: 'What is BYOK?',
            a: 'Bring Your Own Key — paste your Anthropic, OpenAI, or Google API key in Settings and get unlimited AI usage billed directly to your own account. Available on Creator and above.',
          },
          {
            q: 'Can I change my plan?',
            a: 'Yes. Upgrades are immediate. Downgrades take effect at the end of your current billing period. You can manage everything in the billing portal.',
          },
          {
            q: 'Do unused generations roll over?',
            a: 'No — the monthly generation limit resets on the first of each month. BYOK users are not affected since their usage goes directly to their API account.',
          },
          {
            q: 'Is there a trial?',
            a: 'The free tier is effectively a permanent trial — you get 20 AI generations per month with no credit card required. Upgrade anytime.',
          },
        ].map(({ q, a }) => (
          <div key={q} style={{ marginBottom: 24, borderBottom: '1px solid #f0f4ff', paddingBottom: 24 }}>
            <div style={{ fontWeight: 700, color: '#0f0c29', marginBottom: 8, fontSize: 15 }}>{q}</div>
            <div style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>{a}</div>
          </div>
        ))}
      </div>

    </div>
  )
}
