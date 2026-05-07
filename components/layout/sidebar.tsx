'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Upload, Brain, Lightbulb, Settings } from 'lucide-react'

const nav = [
  { href: '/',         label: 'Overview',  icon: LayoutDashboard },
  { href: '/briefing', label: 'Briefing',  icon: Lightbulb },
  { href: '/memory',   label: 'Memory',    icon: Brain },
  { href: '/import',   label: 'Import',    icon: Upload },
  { href: '/settings', label: 'Settings',  icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r bg-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b">
        <span className="font-bold text-primary text-base">CreatorGraph</span>
        <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Lite</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary/10 text-primary'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Version */}
      <div className="px-5 py-3 border-t">
        <p className="text-xs text-slate-400">v0.1.0 — tutorial build</p>
      </div>
    </aside>
  )
}
