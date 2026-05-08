'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'

interface UpgradePromptProps {
  message?:   string
  targetTier?: 'creator' | 'creator_pro' | 'enterprise'
  compact?:   boolean
}

export function UpgradePrompt({
  message   = 'Monthly AI limit reached.',
  targetTier = 'creator',
  compact   = false,
}: UpgradePromptProps) {
  const [loading, setLoading] = useState(false)

  const labels = {
    creator:     { name: 'Creator', price: '$29/mo', color: '#4f46e5' },
    creator_pro: { name: 'Creator Pro', price: '$59/mo', color: '#7c3aed' },
    enterprise:  { name: 'Enterprise', price: '$249/mo', color: '#0f0c29' },
  }
  const label = labels[targetTier]

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tier: targetTier, interval: 'month' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a' }}>
        <Zap style={{ width: 14, height: 14, color: '#d97706', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: '#92400e' }}>{message}</span>
        <a href="/pricing" style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
          Upgrade
        </a>
      </div>
    )
  }

  return (
    <div style={{
      padding: '24px', borderRadius: 14,
      background: `${label.color}08`,
      border:     `1px solid ${label.color}25`,
      textAlign:  'center',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${label.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
        <Zap style={{ width: 20, height: 20, color: label.color }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#0f0c29', marginBottom: 6 }}>
        {message}
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 18 }}>
        Upgrade to {label.name} ({label.price}) for more AI generations,
        all platforms, and full prompt vault access.
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: label.color, color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          {loading ? 'Redirecting...' : `Upgrade to ${label.name}`}
        </button>
        <a href="/pricing" style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid #e0e7ff',
          background: '#fff', color: '#4b5563',
          fontWeight: 600, fontSize: 14, textDecoration: 'none',
          display: 'flex', alignItems: 'center',
        }}>
          See all plans
        </a>
      </div>
    </div>
  )
}
