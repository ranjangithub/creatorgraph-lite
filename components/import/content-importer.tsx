'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader2, Link as LinkIcon } from 'lucide-react'

type Source = 'linkedin' | 'medium' | 'substack' | 'github' | 'file'
type Status = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

const sources: { id: Source; label: string; logo: string; hint: string; type: 'url' | 'file'; placeholder?: string; fileTypes?: string; fileAccept?: string }[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    logo: 'in',
    hint: 'Upload your LinkedIn data export (CSV or ZIP)',
    type: 'file',
    fileTypes: 'CSV, ZIP',
    fileAccept: '.csv,.zip',
  },
  {
    id: 'medium',
    label: 'Medium',
    logo: 'M',
    hint: 'Your Medium profile URL',
    type: 'url',
    placeholder: 'https://medium.com/@yourname',
  },
  {
    id: 'substack',
    label: 'Substack',
    logo: 'S',
    hint: 'Your Substack publication URL',
    type: 'url',
    placeholder: 'https://yourname.substack.com',
  },
  {
    id: 'github',
    label: 'GitHub',
    logo: 'GH',
    hint: 'Your GitHub profile URL',
    type: 'url',
    placeholder: 'https://github.com/yourname',
  },
  {
    id: 'file',
    label: 'Local file',
    logo: '↑',
    hint: 'Upload any markdown, text, or document',
    type: 'file',
    fileTypes: 'MD, TXT, PDF',
    fileAccept: '.md,.txt,.pdf,.csv',
  },
]

const sourceColors: Record<Source, { color: string; bg: string; border: string; logoBg: string; logoColor: string }> = {
  linkedin: { color: '#0a66c2', bg: '#eff6ff', border: '#bfdbfe', logoBg: '#0a66c2', logoColor: '#fff' },
  medium:   { color: '#000',    bg: '#f9f9f9', border: '#e5e7eb', logoBg: '#000',    logoColor: '#fff' },
  substack: { color: '#ff6719', bg: '#fff7f3', border: '#fed7aa', logoBg: '#ff6719', logoColor: '#fff' },
  github:   { color: '#1f2328', bg: '#f6f8fa', border: '#d0d7de', logoBg: '#1f2328', logoColor: '#fff' },
  file:     { color: '#4f46e5', bg: '#faf5ff', border: '#e9d5ff', logoBg: '#ede9fe', logoColor: '#4f46e5' },
}

export function ContentImporter() {
  const [active, setActive]     = useState<Source>('linkedin')
  const [url, setUrl]           = useState('')
  const [status, setStatus]     = useState<Status>('idle')
  const [message, setMessage]   = useState('')
  const [stats, setStats]       = useState<{ imported: number; memories: number } | null>(null)
  const inputRef                = useRef<HTMLInputElement>(null)

  const src    = sources.find(s => s.id === active)!
  const colors = sourceColors[active]

  function reset() { setStatus('idle'); setMessage(''); setStats(null); setUrl('') }

  async function submit(payload: { content?: string; url?: string; fileName?: string; source: string }) {
    setStatus('processing')
    setMessage('Extracting content and building memory…')
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }))
      setStatus('error')
      setMessage(err.error ?? 'Import failed. Please try again.')
      return
    }
    const data = await res.json()
    setStatus('done')
    setStats({ imported: data.imported, memories: data.memories })
    setMessage(`Done! ${data.imported} posts imported, ${data.memories} memories extracted.`)
  }

  async function handleFile(file: File) {
    const allowed = src.fileAccept?.split(',') ?? []
    if (!allowed.some(ext => file.name.endsWith(ext.trim()))) {
      setStatus('error')
      setMessage(`Please upload a ${src.fileTypes} file.`)
      return
    }
    setStatus('uploading')
    setMessage('Reading file…')
    const text = await file.text()
    await submit({ content: text, fileName: file.name, source: active })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleUrl() {
    if (!url.trim()) return
    setStatus('uploading')
    setMessage(`Fetching content from ${src.label}…`)
    await submit({ url: url.trim(), source: active })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Source picker */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {sources.map(s => {
          const c   = sourceColors[s.id]
          const sel = s.id === active
          return (
            <button
              key={s.id}
              onClick={() => { setActive(s.id); reset() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 9, cursor: 'pointer',
                border: sel ? `2px solid ${c.border}` : '2px solid #e0e7ff',
                background: sel ? c.bg : '#fafbff',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                background: sel ? c.logoBg : '#e0e7ff',
                color: sel ? c.logoColor : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 900, letterSpacing: '-0.5px',
              }}>
                {s.logo}
              </div>
              <span style={{ fontSize: 13, fontWeight: sel ? 700 : 500, color: sel ? c.color : '#6b7280' }}>
                {s.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Hint */}
      <p style={{ fontSize: 13, color: '#94a3b8', marginTop: -8 }}>{src.hint}</p>

      {/* URL input */}
      {src.type === 'url' && status === 'idle' && (
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <LinkIcon size={14} color="#94a3b8" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              autoFocus
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUrl()}
              placeholder={src.placeholder}
              style={{
                width: '100%', padding: '13px 14px 13px 36px', fontSize: 14,
                border: `1.5px solid ${colors.border}`, borderRadius: 9, outline: 'none',
                color: '#0f0c29', background: colors.bg, boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = colors.color }}
              onBlur={e => { e.currentTarget.style.borderColor = colors.border }}
            />
          </div>
          <button
            onClick={handleUrl}
            disabled={!url.trim()}
            style={{
              padding: '0 22px', background: url.trim() ? colors.logoBg : '#e0e7ff',
              color: url.trim() ? (colors.logoColor) : '#94a3b8',
              border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700,
              cursor: url.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
          >
            Import
          </button>
        </div>
      )}

      {/* File drop zone */}
      {src.type === 'file' && status === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLDivElement
            el.style.borderColor = colors.color
            el.style.background = colors.bg
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLDivElement
            el.style.borderColor = colors.border
            el.style.background = '#fafaff'
          }}
          style={{
            border: `2px dashed ${colors.border}`, borderRadius: 12,
            padding: '40px 32px', textAlign: 'center', cursor: 'pointer',
            background: '#fafaff', transition: 'all 0.2s',
          }}
        >
          <input
            ref={inputRef} type="file" accept={src.fileAccept} style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          <div style={{
            width: 52, height: 52, borderRadius: 13, background: colors.bg, border: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <Upload size={22} color={colors.color} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f0c29', marginBottom: 5 }}>
            Drop your {src.label} {active === 'linkedin' ? 'export' : 'file'} here
          </p>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            or click to browse — {src.fileTypes} accepted
          </p>
        </div>
      )}

      {/* Processing */}
      {(status === 'uploading' || status === 'processing') && (
        <div style={{
          border: `2px dashed ${colors.border}`, borderRadius: 12,
          padding: '40px 32px', textAlign: 'center', background: colors.bg,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 13, background: colors.bg, border: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <Loader2 size={22} color={colors.color} className="animate-spin" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f0c29', marginBottom: 5 }}>{message}</p>
          <p style={{ fontSize: 13, color: '#6b7280' }}>This may take a minute for large exports</p>
        </div>
      )}

      {/* Done */}
      {status === 'done' && (
        <div style={{
          border: '2px dashed #86efac', borderRadius: 12,
          padding: '40px 32px', textAlign: 'center', background: '#f0fdf4',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 13, background: '#dcfce7', border: '1px solid #86efac',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <CheckCircle size={22} color="#16a34a" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f0c29', marginBottom: 5 }}>{message}</p>
          <button
            onClick={reset}
            style={{
              marginTop: 12, padding: '8px 18px', background: colors.bg,
              color: colors.color, border: `1px solid ${colors.border}`,
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Import another source
          </button>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div style={{
          border: '2px dashed #fca5a5', borderRadius: 12,
          padding: '40px 32px', textAlign: 'center', background: '#fff5f5',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 13, background: '#fee2e2', border: '1px solid #fca5a5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <AlertCircle size={22} color="#dc2626" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 5 }}>{message}</p>
          <button
            onClick={reset}
            style={{
              marginTop: 12, padding: '8px 18px', background: '#fafafa',
              color: '#6b7280', border: '1px solid #e5e7eb',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1d4ed8', lineHeight: 1 }}>{stats.imported}</p>
            <p style={{ fontSize: 12, color: '#3b82f6', marginTop: 4, fontWeight: 600 }}>posts imported</p>
          </div>
          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed', lineHeight: 1 }}>{stats.memories}</p>
            <p style={{ fontSize: 12, color: '#8b5cf6', marginTop: 4, fontWeight: 600 }}>memories extracted</p>
          </div>
        </div>
      )}
    </div>
  )
}
