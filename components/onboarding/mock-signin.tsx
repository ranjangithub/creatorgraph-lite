'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sparkles } from 'lucide-react'

export function MockSignIn() {
  const router = useRouter()

  useEffect(() => {
    // In mock mode, sign-in is instant — just go to dashboard
    const t = setTimeout(() => router.push('/'), 1200)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '3px solid rgba(165,180,252,0.4)' }}>
          <Sparkles size={28} color="#fff" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Signing you in…</h2>
        <p style={{ fontSize: 14, color: 'rgba(165,180,252,0.6)' }}>Mock mode — no credentials needed</p>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#a5b4fc', animation: `pulse 1.2s ${i * 0.2}s infinite`, opacity: 0.7 }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.3);opacity:1} }`}</style>
      </div>
    </div>
  )
}
