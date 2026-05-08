'use client'

import * as React from 'react'

interface ProgressProps {
  value?:    number      // 0–100
  className?: string
}

export function Progress({ value = 0, className = '' }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`relative overflow-hidden rounded-full bg-secondary ${className}`}
      style={{ background: '#e0e7ff', borderRadius: 9999 }}
    >
      <div
        style={{
          height:     '100%',
          width:      `${clamped}%`,
          background: clamped >= 90
            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
            : clamped >= 70
            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
            : 'linear-gradient(90deg, #4f46e5, #7c3aed)',
          transition: 'width 0.3s ease',
          borderRadius: 9999,
        }}
      />
    </div>
  )
}
