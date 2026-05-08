'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type Status = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export function LinkedInUploader() {
  const [status, setStatus]   = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [stats, setStats]     = useState<{ imported: number; memories: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.zip') && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setStatus('error')
      setMessage('Please upload a CSV, TXT, MD, or ZIP file.')
      return
    }
    setStatus('uploading')
    setMessage('Reading file…')
    const text = await file.text()
    setStatus('processing')
    setMessage('Extracting content and building memory…')
    const res = await fetch('/api/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, fileName: file.name }),
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const iconWrap = (bg: string, border: string) => ({
    width: 52, height: 52, borderRadius: 13, background: bg, border: `1px solid ${border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed #c4b5fd',
          borderRadius: 12,
          padding: '40px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          background: status === 'idle' ? '#fafaff' : '#fff',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#7c3aed'; (e.currentTarget as HTMLDivElement).style.background = '#faf5ff'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#c4b5fd'; (e.currentTarget as HTMLDivElement).style.background = '#fafaff'; }}
      >
        <input ref={inputRef} type="file" accept=".csv,.zip,.txt,.md" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

        {status === 'idle' && (
          <>
            <div style={iconWrap('#ede9fe', '#c4b5fd')}><Upload size={22} color="#4f46e5" /></div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f0c29', marginBottom: 5 }}>Drop your LinkedIn export here</p>
            <p style={{ fontSize: 13, color: '#6b7280' }}>or click to browse — CSV, ZIP, MD, TXT accepted</p>
          </>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <>
            <div style={iconWrap('#ede9fe', '#c4b5fd')}><Loader2 size={22} color="#4f46e5" className="animate-spin" /></div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f0c29', marginBottom: 5 }}>{message}</p>
            <p style={{ fontSize: 13, color: '#6b7280' }}>This may take a minute for large exports</p>
          </>
        )}

        {status === 'done' && (
          <>
            <div style={iconWrap('#dcfce7', '#86efac')}><CheckCircle size={22} color="#16a34a" /></div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f0c29', marginBottom: 5 }}>{message}</p>
            <button
              onClick={e => { e.stopPropagation(); setStatus('idle'); setStats(null) }}
              style={{ marginTop: 12, padding: '8px 18px', background: '#ede9fe', color: '#4f46e5', border: '1px solid #c4b5fd', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Import another file
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={iconWrap('#fee2e2', '#fca5a5')}><AlertCircle size={22} color="#dc2626" /></div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 5 }}>{message}</p>
            <button
              onClick={e => { e.stopPropagation(); setStatus('idle') }}
              style={{ marginTop: 12, padding: '8px 18px', background: '#fafafa', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Try again
            </button>
          </>
        )}
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1d4ed8', lineHeight: 1 }}>{stats.imported}</p>
            <p style={{ fontSize: 12, color: '#3b82f6', marginTop: 4, fontWeight: 600 }}>posts imported</p>
          </div>
          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed', lineHeight: 1 }}>{stats.memories}</p>
            <p style={{ fontSize: 12, color: '#8b5cf6', marginTop: 4, fontWeight: 600 }}>memories extracted</p>
          </div>
        </div>
      )}
    </div>
  )
}
