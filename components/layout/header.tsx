import React from 'react'
import { UserButton } from '@clerk/nextjs'
import { MOCK_AUTH, MOCK_USER_NAME } from '@/lib/auth'

interface HeaderProps {
  title:        React.ReactNode
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header style={{
      height: 56,
      borderBottom: '1px solid #e0e7ff',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div>
        <h1 style={{ fontSize: 14, fontWeight: 700, color: '#0f0c29', letterSpacing: '-0.2px', lineHeight: 1.3 }}>{title}</h1>
        {description && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{description}</p>}
      </div>
      {MOCK_AUTH ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 20 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>
            {MOCK_USER_NAME[0]}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>mock mode</span>
        </div>
      ) : (
        <UserButton afterSignOutUrl="/" />
      )}
    </header>
  )
}
