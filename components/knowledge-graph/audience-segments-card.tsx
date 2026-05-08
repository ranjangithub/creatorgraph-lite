'use client'

import { useState, useRef } from 'react'
import { Users, Pencil, Plus, X, ChevronDown, ChevronUp, HelpCircle, Check } from 'lucide-react'

interface Segment {
  id:   string
  name: string
}

interface Question {
  id:        string
  question:  string
  painPoint: string | null
  segments:  string[] | null
  resolved:  boolean | null
}

interface Props {
  initialSegments: Segment[]
  questions:       Question[]
}

export function AudienceSegmentsCard({ initialSegments, questions }: Props) {
  const [segments, setSegments]     = useState<Segment[]>(initialSegments)
  const [editing, setEditing]       = useState(false)
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [newName, setNewName]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editName, setEditName]     = useState('')
  const [error, setError]           = useState<string | null>(null)
  const inputRef                    = useRef<HTMLInputElement>(null)

  function questionsForSegment(name: string) {
    return questions.filter(q => q.segments?.includes(name) ?? false)
  }

  function toggleExpand(id: string) {
    if (editing) return
    setExpanded(e => e === id ? null : id)
  }

  async function addSegment() {
    if (!newName.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/audience-segments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      const row = await res.json() as Segment
      setSegments(prev => [...prev.filter(s => s.id !== row.id), row])
      setNewName('')
      inputRef.current?.focus()
    } catch {
      setError('Failed to add segment')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSegment(id: string) {
    setSegments(prev => prev.filter(s => s.id !== id))
    try {
      await fetch(`/api/audience-segments/${id}`, { method: 'DELETE' })
    } catch {
      // optimistic — if it fails the user can refresh
    }
  }

  async function saveRename(id: string) {
    if (!editName.trim()) { cancelRename(); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/audience-segments/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      if (!res.ok) throw new Error()
      const row = await res.json() as Segment
      setSegments(prev => prev.map(s => s.id === id ? row : s))
    } catch {
      setError('Failed to rename')
    } finally {
      setSaving(false)
      setEditingId(null)
    }
  }

  function startRename(s: Segment) {
    setEditingId(s.id)
    setEditName(s.name)
  }

  function cancelRename() {
    setEditingId(null)
    setEditName('')
  }

  if (segments.length === 0 && !editing) return null

  return (
    <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 14, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f4ff', background: '#fafbff', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Users size={14} color="#059669" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>Who reads your content</span>
        <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 'auto' }}>
          {segments.length} segment{segments.length !== 1 ? 's' : ''} · detected from your posts
        </span>
        <button
          onClick={() => { setEditing(e => !e); setExpanded(null); setNewName(''); setError(null) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
            color: editing ? '#4f46e5' : '#6b7280',
            background: editing ? '#ede9fe' : 'transparent',
            border: editing ? '1px solid #c4b5fd' : '1px solid #e0e7ff',
            borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
          }}
        >
          <Pencil size={11} />
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {/* Explanation when empty */}
      {segments.length === 0 && (
        <div style={{ padding: '16px 20px', fontSize: 13, color: '#94a3b8' }}>
          No audience segments detected yet. Import more content and run the knowledge graph extraction.
        </div>
      )}

      {/* Segment tags / edit mode */}
      <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {segments.map(s => {
          const relatedQs = questionsForSegment(s.name)
          const isOpen    = expanded === s.id

          return (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Tag row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {editing && editingId === s.id ? (
                  /* Inline rename input */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveRename(s.id); if (e.key === 'Escape') cancelRename() }}
                      style={{ fontSize: 12, padding: '4px 8px', border: '1.5px solid #4f46e5', borderRadius: 8, outline: 'none', width: 120 }}
                    />
                    <button onClick={() => saveRename(s.id)} disabled={saving} style={{ border: 'none', background: '#ecfdf5', borderRadius: 6, padding: 4, cursor: 'pointer' }}>
                      <Check size={11} color="#059669" />
                    </button>
                    <button onClick={cancelRename} style={{ border: 'none', background: '#fee2e2', borderRadius: 6, padding: 4, cursor: 'pointer' }}>
                      <X size={11} color="#dc2626" />
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 0,
                      fontSize: 12, fontWeight: 600,
                      padding: editing ? '4px 8px 4px 12px' : '5px 14px',
                      borderRadius: editing ? '20px' : isOpen ? '20px 20px 0 0' : '20px',
                      background: isOpen ? '#059669' : '#ecfdf5',
                      color:      isOpen ? '#fff' : '#059669',
                      border:     `1px solid ${isOpen ? '#059669' : '#6ee7b7'}`,
                      cursor:     editing ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                      userSelect: 'none',
                    }}
                    onClick={() => !editing && toggleExpand(s.id)}
                  >
                    <span
                      onClick={e => { if (editing) { e.stopPropagation(); startRename(s) } }}
                      style={{ cursor: editing ? 'text' : 'inherit' }}
                      title={editing ? 'Click to rename' : undefined}
                    >
                      {s.name}
                    </span>

                    {!editing && (
                      <span style={{ marginLeft: 6 }}>
                        {isOpen ? <ChevronUp size={12} /> : (
                          relatedQs.length > 0
                            ? <span style={{ background: 'rgba(5,150,105,0.15)', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 999, marginLeft: 2 }}>{relatedQs.length}</span>
                            : <ChevronDown size={12} />
                        )}
                      </span>
                    )}

                    {editing && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteSegment(s.id) }}
                        style={{ marginLeft: 6, background: 'rgba(5,150,105,0.15)', border: 'none', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                        title="Remove"
                      >
                        <X size={9} color="#059669" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded detail panel */}
              {isOpen && !editing && (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #059669', borderTop: 'none',
                  borderRadius: '0 8px 8px 8px', padding: '12px 14px', minWidth: 260, maxWidth: 340,
                  position: 'relative', zIndex: 1,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HelpCircle size={12} />
                    Questions from this audience
                  </div>
                  {relatedQs.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#6b7280' }}>No specific questions detected yet for this segment.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {relatedQs.slice(0, 5).map(q => (
                        <div key={q.id} style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                          <span style={{ color: '#059669', marginRight: 4 }}>•</span>
                          {q.question}
                          {q.painPoint && (
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, marginLeft: 12 }}>
                              Pain: {q.painPoint}
                            </div>
                          )}
                        </div>
                      ))}
                      {relatedQs.length > 5 && (
                        <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>+{relatedQs.length - 5} more questions</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Add new segment input in edit mode */}
        {editing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              ref={inputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSegment()}
              placeholder="Add segment..."
              style={{
                fontSize: 12, padding: '5px 10px',
                border: '1.5px dashed #6ee7b7', borderRadius: 20, outline: 'none',
                background: '#f0fdf4', color: '#059669', width: 130,
              }}
            />
            <button
              onClick={addSegment}
              disabled={!newName.trim() || saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 600, padding: '5px 10px',
                background: newName.trim() ? '#059669' : '#e0e7ff',
                color: newName.trim() ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 20, cursor: newName.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              <Plus size={11} /> Add
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '8px 20px', background: '#fee2e2', color: '#dc2626', fontSize: 12 }}>{error}</div>
      )}

      {!editing && segments.length > 0 && (
        <div style={{ padding: '8px 20px', borderTop: '1px solid #f0f4ff', fontSize: 11, color: '#94a3b8' }}>
          Click a segment to see what questions that audience is asking · Click Edit to add or remove segments
        </div>
      )}
    </div>
  )
}
