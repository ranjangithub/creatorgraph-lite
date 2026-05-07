'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
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
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content: text, fileName: file.name }),
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

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.zip,.txt,.md"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        {status === 'idle' && (
          <>
            <Upload size={32} className="mx-auto mb-3 text-slate-400" />
            <p className="font-medium text-slate-700">Drop your LinkedIn export here</p>
            <p className="text-sm text-slate-400 mt-1">or click to browse — CSV, ZIP, MD, TXT accepted</p>
          </>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <>
            <Loader2 size={32} className="mx-auto mb-3 text-primary animate-spin" />
            <p className="font-medium text-slate-700">{message}</p>
            <p className="text-sm text-slate-400 mt-1">This may take a minute for large exports</p>
          </>
        )}

        {status === 'done' && (
          <>
            <CheckCircle size={32} className="mx-auto mb-3 text-green-500" />
            <p className="font-medium text-slate-700">{message}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={e => { e.stopPropagation(); setStatus('idle'); setStats(null) }}>
              Import another file
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={32} className="mx-auto mb-3 text-red-500" />
            <p className="font-medium text-red-600">{message}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={e => { e.stopPropagation(); setStatus('idle') }}>
              Try again
            </Button>
          </>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.imported}</p>
            <p className="text-xs text-blue-500 mt-0.5">posts imported</p>
          </div>
          <div className="bg-violet-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-violet-700">{stats.memories}</p>
            <p className="text-xs text-violet-500 mt-0.5">memories extracted</p>
          </div>
        </div>
      )}
    </div>
  )
}
