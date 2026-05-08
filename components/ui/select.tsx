'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

// ── Context ───────────────────────────────────────────────────────────────────

interface SelectContextValue {
  value:    string
  onChange: (value: string) => void
  open:     boolean
  setOpen:  (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelect() {
  const ctx = React.useContext(SelectContext)
  if (!ctx) throw new Error('Select components must be used within <Select>')
  return ctx
}

// ── Select ────────────────────────────────────────────────────────────────────

interface SelectProps {
  value:          string
  onValueChange:  (value: string) => void
  children:       React.ReactNode
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)

  // Close on outside click
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <SelectContext.Provider value={{ value, onChange: onValueChange, open, setOpen }}>
      <div ref={ref} style={{ position: 'relative' }}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

// ── SelectTrigger ─────────────────────────────────────────────────────────────

export function SelectTrigger({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  const { open, setOpen } = useSelect()
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ cursor: 'pointer', textAlign: 'left' }}
    >
      {children}
      <ChevronDown style={{ width: 16, height: 16, opacity: 0.5, flexShrink: 0 }} />
    </button>
  )
}

// ── SelectValue ───────────────────────────────────────────────────────────────

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelect()
  return <span style={{ flex: 1 }}>{value || placeholder}</span>
}

// ── SelectContent ─────────────────────────────────────────────────────────────

export function SelectContent({ children }: { children: React.ReactNode }) {
  const { open } = useSelect()
  if (!open) return null
  return (
    <div
      style={{
        position:        'absolute',
        top:             '100%',
        left:            0,
        right:           0,
        zIndex:          50,
        background:      '#fff',
        border:          '1px solid #e0e7ff',
        borderRadius:    8,
        boxShadow:       '0 4px 20px rgba(0,0,0,0.12)',
        marginTop:       4,
        maxHeight:       280,
        overflowY:       'auto',
      }}
    >
      {children}
    </div>
  )
}

// ── SelectItem ────────────────────────────────────────────────────────────────

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: current, onChange, setOpen } = useSelect()
  const selected = value === current
  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={() => { onChange(value); setOpen(false) }}
      style={{
        padding:     '8px 12px',
        cursor:      'pointer',
        background:  selected ? '#f0f4ff' : 'transparent',
        fontWeight:  selected ? 600 : 400,
        fontSize:    14,
        color:       selected ? '#4f46e5' : '#1f2937',
        display:     'flex',
        alignItems:  'center',
        gap:         8,
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = '#fafbff' }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      {children}
    </div>
  )
}
