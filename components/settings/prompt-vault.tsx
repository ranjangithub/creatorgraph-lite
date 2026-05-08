'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Save, X } from 'lucide-react'

const PLATFORMS = ['linkedin', 'instagram', 'youtube', 'medium', 'substack', 'tiktok']
const CONTENT_TYPES: Record<string, string[]> = {
  linkedin:  ['post', 'article', 'carousel', 'newsletter'],
  instagram: ['reel', 'carousel', 'post', 'story'],
  youtube:   ['video', 'short'],
  medium:    ['article'],
  substack:  ['newsletter'],
  tiktok:    ['reel', 'short'],
}

const PLATFORM_COLORS: Record<string, { bg: string; color: string }> = {
  linkedin:  { bg: '#dbeafe', color: '#1d4ed8' },
  instagram: { bg: '#fce7f3', color: '#be185d' },
  youtube:   { bg: '#fee2e2', color: '#dc2626' },
  medium:    { bg: '#d1fae5', color: '#065f46' },
  substack:  { bg: '#fef3c7', color: '#92400e' },
  tiktok:    { bg: '#f3e8ff', color: '#7c3aed' },
}

interface Template {
  id:                 string
  name:               string
  platform:           string
  contentType:        string
  toneInstructions:   string | null
  brandVoice:         string | null
  formatInstructions: string | null
  hashtags:           string[]
  customPrompt:       string | null
  isDefault:          boolean
}

interface EditState {
  name:               string
  platform:           string
  contentType:        string
  toneInstructions:   string
  brandVoice:         string
  formatInstructions: string
  hashtags:           string      // comma-separated in the input
  customPrompt:       string
}

function blankEdit(platform = 'linkedin'): EditState {
  return {
    name: '', platform, contentType: 'post',
    toneInstructions: '', brandVoice: '', formatInstructions: '',
    hashtags: '', customPrompt: '',
  }
}

function templateToEdit(t: Template): EditState {
  return {
    name:               t.name,
    platform:           t.platform,
    contentType:        t.contentType,
    toneInstructions:   t.toneInstructions ?? '',
    brandVoice:         t.brandVoice ?? '',
    formatInstructions: t.formatInstructions ?? '',
    hashtags:           (t.hashtags ?? []).join(', '),
    customPrompt:       t.customPrompt ?? '',
  }
}

function EditForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: EditState
  onSave:  (data: EditState) => void
  onCancel: () => void
  saving:  boolean
}) {
  const [form, setForm] = useState(initial)
  const set = (k: keyof EditState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const field = (label: string, key: keyof EditState, hint?: string, multi?: boolean) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{hint}</p>}
      {multi ? (
        <textarea
          value={form[key] as string}
          onChange={set(key)}
          rows={3}
          style={{ padding: '8px 10px', fontSize: 13, border: '1.5px solid #e0e7ff', borderRadius: 8, outline: 'none', resize: 'vertical', fontFamily: 'inherit', color: '#0f0c29' }}
        />
      ) : (
        <input
          value={form[key] as string}
          onChange={set(key)}
          style={{ padding: '8px 10px', fontSize: 13, border: '1.5px solid #e0e7ff', borderRadius: 8, outline: 'none', color: '#0f0c29' }}
        />
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 22px', background: '#fafbff', borderTop: '1px solid #e0e7ff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {field('Template name', 'name')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Platform</label>
          <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value, contentType: CONTENT_TYPES[e.target.value]?.[0] ?? 'post' }))}
            style={{ padding: '8px 10px', fontSize: 13, border: '1.5px solid #e0e7ff', borderRadius: 8, outline: 'none', background: '#fff', color: '#0f0c29' }}>
            {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Content type</label>
          <select value={form.contentType} onChange={set('contentType')}
            style={{ padding: '8px 10px', fontSize: 13, border: '1.5px solid #e0e7ff', borderRadius: 8, outline: 'none', background: '#fff', color: '#0f0c29' }}>
            {(CONTENT_TYPES[form.platform] ?? ['post']).map(ct => <option key={ct} value={ct}>{ct}</option>)}
          </select>
        </div>
      </div>

      {field('Brand voice / persona', 'brandVoice', 'Who is speaking? e.g. "A senior engineer who\'s seen it all"', true)}
      {field('Tone', 'toneInstructions', 'e.g. "Direct, first-person, no fluff, short sentences"')}
      {field('Format instructions', 'formatInstructions', 'Structure, length, style rules for the AI', true)}
      {field('Hashtags', 'hashtags', 'Comma-separated — added to every post using this template')}
      {field('Extra instructions', 'customPrompt', 'Any other instructions appended to the prompt', true)}

      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <button onClick={() => onSave(form)} disabled={saving || !form.name.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer', opacity: saving || !form.name.trim() ? 0.7 : 1 }}>
          <Save size={13} /> {saving ? 'Saving…' : 'Save template'}
        </button>
        <button onClick={onCancel}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', background: 'none', border: '1px solid #e0e7ff', borderRadius: 8, fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  )
}

export function PromptVault() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading]     = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)   // existing template being edited
  const [addingNew, setAddingNew] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/prompts')
      .then(r => r.json())
      .then(d => setTemplates(d.templates ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveNew(data: EditState) {
    setSaving(true)
    const res  = await fetch('/api/prompts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        hashtags: data.hashtags.split(',').map(h => h.trim()).filter(Boolean),
      }),
    })
    const json = await res.json()
    setTemplates(ts => [json.template, ...ts])
    setAddingNew(false)
    setSaving(false)
  }

  async function handleSaveEdit(id: string, data: EditState) {
    setSaving(true)
    const res  = await fetch(`/api/prompts/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        hashtags: data.hashtags.split(',').map(h => h.trim()).filter(Boolean),
      }),
    })
    const json = await res.json()
    setTemplates(ts => ts.map(t => t.id === id ? json.template : t))
    setEditingId(null)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return
    await fetch(`/api/prompts/${id}`, { method: 'DELETE' })
    setTemplates(ts => ts.filter(t => t.id !== id))
  }

  if (loading) return null

  return (
    <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 22px', borderBottom: '1px solid #f0f4ff', background: '#fafbff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>Prompt Vault</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Reusable voice + format templates per platform. AI uses these to generate your drafts.</div>
        </div>
        <button onClick={() => { setAddingNew(true); setEditingId(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          <Plus size={12} /> New template
        </button>
      </div>

      {/* Add new form */}
      {addingNew && (
        <EditForm
          initial={blankEdit()}
          onSave={handleSaveNew}
          onCancel={() => setAddingNew(false)}
          saving={saving}
        />
      )}

      {/* Template list */}
      {templates.length === 0 && !addingNew && (
        <div style={{ padding: '32px 22px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
          No templates yet — click "New template" to add one.
        </div>
      )}

      {templates.map((t, i) => {
        const pc = PLATFORM_COLORS[t.platform] ?? { bg: '#f0f4ff', color: '#4f46e5' }
        const isOpen = expanded === t.id
        return (
          <div key={t.id} style={{ borderBottom: i < templates.length - 1 ? '1px solid #f0f4ff' : 'none' }}>
            <div style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: pc.bg, color: pc.color, flexShrink: 0, textTransform: 'capitalize' }}>
                {t.platform}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', flexShrink: 0 }}>{t.contentType}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0f0c29' }}>{t.name}</span>
              {t.isDefault && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#f0f4ff', color: '#4f46e5', flexShrink: 0 }}>sample</span>
              )}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => setExpanded(isOpen ? null : t.id)}
                  style={{ padding: '5px 7px', background: 'none', border: '1px solid #e0e7ff', borderRadius: 6, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}>
                  {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                <button onClick={() => { setEditingId(t.id); setAddingNew(false); setExpanded(null) }}
                  style={{ padding: '5px 7px', background: 'none', border: '1px solid #e0e7ff', borderRadius: 6, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}>
                  <Edit2 size={12} />
                </button>
                <button onClick={() => handleDelete(t.id)}
                  style={{ padding: '5px 7px', background: 'none', border: '1px solid #fee2e2', borderRadius: 6, cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Preview */}
            {isOpen && editingId !== t.id && (
              <div style={{ padding: '0 22px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {t.brandVoice && <Detail label="Voice" value={t.brandVoice} />}
                {t.toneInstructions && <Detail label="Tone" value={t.toneInstructions} />}
                {t.formatInstructions && <Detail label="Format" value={t.formatInstructions} />}
                {t.hashtags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {t.hashtags.map(h => (
                      <span key={h} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: pc.bg, color: pc.color, fontWeight: 600 }}>{h}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Edit form */}
            {editingId === t.id && (
              <EditForm
                initial={templateToEdit(t)}
                onSave={data => handleSaveEdit(t.id, data)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginRight: 6 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#4b5563' }}>{value}</span>
    </div>
  )
}
