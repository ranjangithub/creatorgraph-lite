'use client'

import { useState } from 'react'
import { Users, CheckCircle } from 'lucide-react'

const NICHE_SUGGESTIONS = [
  'Engineering Leadership', 'Product Management', 'DevOps & Platform',
  'AI / Machine Learning', 'Startup & Founder', 'Career Growth',
  'Software Architecture', 'Data Engineering', 'Developer Experience',
  'Security', 'Cloud & Infrastructure',
]

export function NicheSettings({ userId, currentNiche, currentShare }: {
  userId:       string
  currentNiche: string
  currentShare: boolean
}) {
  const [niche, setNiche]   = useState(currentNiche)
  const [share, setShare]   = useState(currentShare)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  async function save() {
    setSaving(true)
    await fetch('/api/settings/niche', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ niche, shareForBenchmark: share }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const changed = niche !== currentNiche || share !== currentShare

  return (
    <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 22px', borderBottom: '1px solid #f0f4ff', background: '#fafbff', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Users size={14} color="#4f46e5" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>Niche benchmarking</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>See how your content coverage compares to creators in your niche</div>
        </div>
      </div>

      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Niche input */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Your content niche
          </label>
          <input
            value={niche}
            onChange={e => setNiche(e.target.value)}
            placeholder="e.g. Engineering Leadership"
            style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1.5px solid #e0e7ff', borderRadius: 9, outline: 'none', color: '#0f0c29', background: '#fafbff', boxSizing: 'border-box' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#6366f1' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e0e7ff' }}
          />
          {/* Suggestions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {NICHE_SUGGESTIONS.filter(s => !niche || s.toLowerCase().includes(niche.toLowerCase())).slice(0, 6).map(s => (
              <button key={s} onClick={() => setNiche(s)}
                style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: niche === s ? '#ede9fe' : '#f0f4ff', color: niche === s ? '#4f46e5' : '#6b7280', border: `1px solid ${niche === s ? '#c4b5fd' : '#e0e7ff'}`, cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Share toggle */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '14px 16px', background: '#fafbff', borderRadius: 10, border: '1px solid #e0e7ff' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f0c29', marginBottom: 3 }}>Share anonymously for benchmarking</div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, maxWidth: 360 }}>
              Contribute your topic coverage (no names, no post content) to the niche aggregate. You unlock cross-creator insights in return.
            </div>
          </div>
          <button
            onClick={() => setShare(s => !s)}
            style={{
              flexShrink: 0, width: 44, height: 24, borderRadius: 12,
              background: share ? '#4f46e5' : '#e0e7ff',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: share ? 22 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={save}
            disabled={!changed || saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: changed ? '#4f46e5' : '#e0e7ff', color: changed ? '#fff' : '#94a3b8', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: changed ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#059669' }}>
              <CheckCircle size={13} /> Saved
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
