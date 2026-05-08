'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Upload, Brain, Lightbulb, Settings, Sparkles } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Overview',  icon: LayoutDashboard },
  { href: '/briefing', label: 'Briefing',  icon: Lightbulb },
  { href: '/memory',   label: 'Memory',    icon: Brain },
  { href: '/import',   label: 'Import',    icon: Upload },
  { href: '/settings', label: 'Settings',  icon: Settings },
]

export function Sidebar({ isMock = false }: { isMock?: boolean }) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: 'linear-gradient(180deg, #0f0c29 0%, #1a1740 60%, #24243e 100%)',
      borderRight: '1px solid rgba(165,180,252,0.1)',
    }}>

      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(165,180,252,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(165,180,252,0.3)', flexShrink: 0 }}>
          <Sparkles size={15} color="#fff" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: 14, letterSpacing: '-0.3px', lineHeight: 1.2 }}>CreatorGraph</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#a5b4fc', letterSpacing: 1.5, textTransform: 'uppercase' }}>Beta</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                textDecoration: 'none',
                color: active ? '#fff' : 'rgba(165,180,252,0.65)',
                background: active ? 'rgba(79,70,229,0.4)' : 'transparent',
                border: active ? '1px solid rgba(165,180,252,0.25)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={15} color={active ? '#a5b4fc' : 'rgba(165,180,252,0.45)'} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {isMock && (
        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid rgba(165,180,252,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
            <span style={{ fontSize: 11, color: 'rgba(165,180,252,0.5)' }}>Mock mode active</span>
          </div>
        </div>
      )}
    </aside>
  )
}
