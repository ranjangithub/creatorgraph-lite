'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Zap } from 'lucide-react'

export function GenerateBriefingButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const router = useRouter()

  async function generate() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/briefing', { method: 'POST' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Unknown error' }))
      setError(data.error ?? 'Generation failed. Please try again.')
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <button
        onClick={generate}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 24px',
          background: '#4f46e5',
          color: '#fff',
          borderRadius: 9,
          fontSize: 14,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          border: 'none',
          boxShadow: '0 0 20px rgba(99,102,241,0.3)',
        }}
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" /> Analysing your memory…</>
          : <><Zap size={15} /> Generate today's briefing</>
        }
      </button>
      {error && (
        <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '8px 16px' }}>{error}</p>
      )}
    </div>
  )
}
