'use client'

import { useState, useEffect } from 'react'
import { cn, scoreBadge } from '@/lib/utils'
import {
  ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Users, TrendingUp,
  CheckCheck, Zap, Sparkles, Wand2, Copy, ExternalLink, Check, Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Template { id: string; name: string; platform: string; contentType: string; hashtags: string[] }

interface IdeaCardProps {
  idea: {
    id:              string
    title:           string
    hook:            string | null
    hookType:        string | null
    rationale:       string
    audienceFit:     string | null
    competitorGap:   string | null
    repetitionRisk:  string | null
    validationScore: number | null
    freshnessScore:  number | null
    status:          string
    targetPlatforms: string[] | null
  }
}

const riskStyle: Record<string, { bg: string; color: string; label: string }> = {
  new:    { bg: '#dcfce7', color: '#15803d', label: 'New angle' },
  sequel: { bg: '#dbeafe', color: '#1d4ed8', label: 'Sequel' },
  repeat: { bg: '#fee2e2', color: '#dc2626', label: 'Repeat ⚠' },
}

const hookTypeLabels: Record<string, string> = {
  question: 'Question', story: 'Story', statistic: 'Stat',
  counterintuitive: 'Contrarian', list: 'List', bold_claim: 'Bold claim',
}

const PLATFORM_LINKS: Record<string, string> = {
  linkedin:  'https://www.linkedin.com/feed/',
  instagram: 'https://www.instagram.com/',
  youtube:   'https://studio.youtube.com/',
  medium:    'https://medium.com/new-story',
  substack:  'https://substack.com/publish/post/new',
}

function FreshnessBar({ score }: { score: number | null }) {
  if (score == null) return null
  const color = score >= 80 ? '#059669' : score >= 50 ? '#d97706' : '#dc2626'
  const label = score >= 80 ? 'Fresh angle' : score >= 50 ? 'Sequel territory' : 'Repeat risk'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 48, height: 3, background: '#e0e7ff', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{label}</span>
    </div>
  )
}

function EngagementForm({ ideaId, platform, onDone }: { ideaId: string; platform: string; onDone: () => void }) {
  const [likes, setLikes]                 = useState('')
  const [comments, setComments]           = useState('')
  const [shares, setShares]               = useState('')
  const [saves, setSaves]                 = useState('')
  const [impressions, setImpressions]     = useState('')
  const [loading, setLoading]             = useState(false)

  async function submit(withMetrics: boolean) {
    setLoading(true)
    await fetch(`/api/ideas/${ideaId}/mark-posted`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withMetrics
        ? { platform, likes: Number(likes) || 0, comments: Number(comments) || 0, shares: Number(shares) || 0, saves: Number(saves) || 0, impressions: Number(impressions) || 0 }
        : { platform, likes: 0, comments: 0, shares: 0, saves: 0, impressions: 0 }),
    })
    onDone()
  }

  const inp = (label: string, val: string, set: (v: string) => void) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>
      <input type="number" min="0" value={val} onChange={e => set(e.target.value)} placeholder="0"
        style={{ width: '100%', padding: '7px 10px', fontSize: 14, fontWeight: 600, border: '1.5px solid #e0e7ff', borderRadius: 7, outline: 'none', color: '#0f0c29', background: '#fafbff', boxSizing: 'border-box' }} />
    </div>
  )

  return (
    <div style={{ padding: '14px 22px 18px', borderTop: '1px solid #e0e7ff', background: '#fafbff' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f0c29', marginBottom: 10 }}>Log performance — powers your hook insights</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        {inp('Likes', likes, setLikes)}
        {inp('Comments', comments, setComments)}
        {inp('Shares', shares, setShares)}
        {inp('Saves', saves, setSaves)}
        {inp('Impressions', impressions, setImpressions)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => submit(true)} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          <CheckCheck size={13} /> Save performance
        </button>
        <button onClick={() => submit(false)} disabled={loading}
          style={{ padding: '8px 14px', background: 'none', border: '1px solid #e0e7ff', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#94a3b8', cursor: 'pointer' }}>
          Skip metrics
        </button>
      </div>
    </div>
  )
}

function GeneratePanel({ idea, onMarkPosted }: { idea: IdeaCardProps['idea']; onMarkPosted: () => void }) {
  const [templates, setTemplates]     = useState<Template[]>([])
  const [templateId, setTemplateId]   = useState('')
  const [platform, setPlatform]       = useState((idea.targetPlatforms ?? ['linkedin'])[0] ?? 'linkedin')
  const [generating, setGenerating]   = useState(false)
  const [draft, setDraft]             = useState('')
  const [hashtags, setHashtags]       = useState<string[]>([])
  const [copied, setCopied]           = useState(false)
  const [showEng, setShowEng]         = useState(false)

  useEffect(() => {
    fetch('/api/prompts').then(r => r.json()).then(d => {
      const ts: Template[] = d.templates ?? []
      setTemplates(ts)
      const match = ts.find(t => t.platform === platform)
      if (match) setTemplateId(match.id)
    })
  }, [platform])

  const selectedTemplate = templates.find(t => t.id === templateId)
  const availablePlatforms = idea.targetPlatforms?.length ? idea.targetPlatforms : ['linkedin']

  async function generate() {
    setGenerating(true)
    setDraft('')
    const res  = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ideaId:      idea.id,
        templateId:  templateId || undefined,
        platform,
        contentType: selectedTemplate?.contentType ?? 'post',
      }),
    })
    const json = await res.json()
    setDraft(json.draft ?? '')
    setHashtags(json.hashtags ?? [])
    setGenerating(false)
  }

  async function copyToClipboard() {
    const full = hashtags.length ? `${draft}\n\n${hashtags.join(' ')}` : draft
    await navigator.clipboard.writeText(full)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openLink = PLATFORM_LINKS[platform]

  if (showEng) {
    return <EngagementForm ideaId={idea.id} platform={platform} onDone={onMarkPosted} />
  }

  return (
    <div style={{ borderTop: '1px solid #e0e7ff', background: '#fafbff' }}>
      {/* Controls */}
      <div style={{ padding: '14px 22px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {/* Platform picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Platform</label>
          <select value={platform} onChange={e => setPlatform(e.target.value)}
            style={{ padding: '7px 10px', fontSize: 13, border: '1.5px solid #e0e7ff', borderRadius: 8, background: '#fff', outline: 'none', color: '#0f0c29' }}>
            {availablePlatforms.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>

        {/* Template picker */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Voice template</label>
          <select value={templateId} onChange={e => setTemplateId(e.target.value)}
            style={{ padding: '7px 10px', fontSize: 13, border: '1.5px solid #e0e7ff', borderRadius: 8, background: '#fff', outline: 'none', color: '#0f0c29' }}>
            <option value="">— No template (default voice) —</option>
            {templates.filter(t => t.platform === platform).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <button onClick={generate} disabled={generating}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1, flexShrink: 0 }}>
          {generating ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Wand2 size={13} />}
          {generating ? 'Generating…' : 'Generate draft'}
        </button>
      </div>

      {/* Draft editor */}
      {draft && (
        <div style={{ padding: '0 22px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={10}
            style={{ width: '100%', padding: '12px 14px', fontSize: 13, lineHeight: 1.7, border: '1.5px solid #c4b5fd', borderRadius: 10, outline: 'none', resize: 'vertical', fontFamily: 'inherit', color: '#0f0c29', background: '#fff', boxSizing: 'border-box' }}
          />

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {hashtags.map(h => (
                <span key={h} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#ede9fe', color: '#6d28d9', fontWeight: 700 }}>{h}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={copyToClipboard}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: copied ? '#059669' : '#0f0c29', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>

            {openLink && (
              <a href={openLink} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1.5px solid #4f46e5', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#4f46e5', textDecoration: 'none', cursor: 'pointer' }}>
                <ExternalLink size={13} /> Open {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </a>
            )}

            <button onClick={() => setShowEng(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'none', border: '1px solid #e0e7ff', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}>
              <Zap size={12} /> I posted it
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#9ca3af' }}>
            Edit the draft above, copy it, paste into {platform.charAt(0).toUpperCase() + platform.slice(1)}, and click "I posted it" to log performance.
          </p>
        </div>
      )}
    </div>
  )
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const [status, setStatus]           = useState(idea.status)
  const [expanded, setExpanded]       = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [loading, setLoading]         = useState(false)

  const score   = idea.validationScore ?? 0
  const risk    = (idea.repetitionRisk ?? 'new').toLowerCase().split(/[^a-z]/)[0]
  const rs      = riskStyle[risk] ?? riskStyle.new
  const htLabel = idea.hookType ? (hookTypeLabels[idea.hookType] ?? idea.hookType) : null

  async function act(action: 'accepted' | 'rejected') {
    setLoading(true)
    await fetch(`/api/ideas/${idea.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action }),
    })
    setStatus(action)
    setLoading(false)
  }

  return (
    <div style={{
      background: status === 'accepted' ? '#f0fdf4' : status === 'published' ? '#eff6ff' : '#fff',
      border: `1px solid ${status === 'accepted' ? '#86efac' : status === 'published' ? '#bfdbfe' : '#e0e7ff'}`,
      borderRadius: 14,
      opacity: status === 'rejected' ? 0.45 : 1,
      transition: 'all 0.2s',
    }}>
      <div style={{ padding: '20px 22px' }}>
        {/* Score + badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 60, height: 4, background: '#e0e7ff', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score}%`, background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', borderRadius: 2 }} />
          </div>
          <Badge variant={scoreBadge(score)} style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{score}/100</Badge>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: rs.bg, color: rs.color }}>{rs.label}</span>
          {htLabel && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f0f4ff', color: '#6366f1' }}>{htLabel}</span>
          )}
          {(idea.targetPlatforms ?? []).map(p => (
            <span key={p} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#fafbff', color: '#94a3b8', border: '1px solid #e0e7ff', textTransform: 'capitalize' }}>{p}</span>
          ))}
        </div>

        <div style={{ marginBottom: 10 }}><FreshnessBar score={idea.freshnessScore} /></div>

        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f0c29', lineHeight: 1.35, marginBottom: 8 }}>{idea.title}</h3>

        {idea.hook && (
          <p style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic', lineHeight: 1.65, marginBottom: 10, paddingLeft: 12, borderLeft: '3px solid #c4b5fd' }}>
            "{idea.hook}"
          </p>
        )}

        <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>{idea.rationale}</p>

        {expanded && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e0e7ff', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {idea.audienceFit && (
              <div style={{ display: 'flex', gap: 10 }}>
                <Users size={13} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 3 }}>Audience fit</div>
                  <p style={{ fontSize: 13, color: '#4b5563' }}>{idea.audienceFit}</p>
                </div>
              </div>
            )}
            {idea.competitorGap && (
              <div style={{ display: 'flex', gap: 10 }}>
                <TrendingUp size={13} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 3 }}>Competitor gap</div>
                  <p style={{ fontSize: 13, color: '#4b5563' }}>{idea.competitorGap}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={() => setExpanded(e => !e)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, fontSize: 12, color: '#94a3b8', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Less detail' : 'More detail'}
        </button>
      </div>

      {/* Suggested actions */}
      {status === 'suggested' && (
        <div style={{ padding: '0 22px 18px', display: 'flex', gap: 8, borderTop: '1px solid #f0f4ff', paddingTop: 14 }}>
          <button onClick={() => act('accepted')} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#4f46e5', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, border: 'none' }}>
            <ThumbsUp size={13} /> Use this idea
          </button>
          <button onClick={() => act('rejected')} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fafafa', color: '#6b7280', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, border: '1px solid #e0e7ff' }}>
            <ThumbsDown size={13} /> Skip
          </button>
        </div>
      )}

      {/* Accepted — write it */}
      {status === 'accepted' && (
        <>
          <div style={{ padding: '0 22px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #bbf7d0', paddingTop: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={13} /> Accepted
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowGenerate(g => !g)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: showGenerate ? '#ede9fe' : 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: showGenerate ? '#6d28d9' : '#fff', border: showGenerate ? '1.5px solid #c4b5fd' : 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Wand2 size={12} /> {showGenerate ? 'Hide draft' : 'Write with AI'}
              </button>
            </div>
          </div>
          {showGenerate && (
            <GeneratePanel
              idea={idea}
              onMarkPosted={() => { setStatus('published'); setShowGenerate(false) }}
            />
          )}
        </>
      )}

      {status === 'published' && (
        <div style={{ padding: '0 22px 16px', borderTop: '1px solid #bfdbfe', paddingTop: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCheck size={13} /> Published — performance logged
          </span>
        </div>
      )}
    </div>
  )
}
