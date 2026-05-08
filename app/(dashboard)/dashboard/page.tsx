import { getOrCreateDbUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { getContentCount } from '@/lib/db/queries/content'
import { getMemoryCount } from '@/lib/db/queries/memory'
import { getTodayBriefing } from '@/lib/db/queries/briefings'
import { getTodayIdeas } from '@/lib/db/queries/ideas'
import { getTopics, getHooks, getOpenQuestions, getAudienceSegments } from '@/lib/db/queries/graph'
import { formatDate } from '@/lib/utils'
import { Brain, FileText, Lightbulb, TrendingUp, Sparkles, AlertCircle, Users, Zap, ArrowRight, Upload } from 'lucide-react'
import Link from 'next/link'
import { Greeting } from '@/components/ui/greeting'
import { AudienceSegmentsCard } from '@/components/knowledge-graph/audience-segments-card'

const TOPIC_COLORS = [
  { color: '#4f46e5', bg: '#ede9fe', border: '#c4b5fd' },
  { color: '#0891b2', bg: '#e0f2fe', border: '#7dd3fc' },
  { color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
  { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { color: '#7c3aed', bg: '#f3e8ff', border: '#d8b4fe' },
  { color: '#db2777', bg: '#fdf2f8', border: '#f9a8d4' },
]

const HOOK_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  question:      { bg: '#eff6ff', color: '#1d4ed8' },
  story:         { bg: '#fdf2f8', color: '#9d174d' },
  statistic:     { bg: '#f0fdf4', color: '#166534' },
  counterintuitive: { bg: '#fff7ed', color: '#9a3412' },
  list:          { bg: '#f5f3ff', color: '#5b21b6' },
  bold_claim:    { bg: '#fef2f2', color: '#991b1b' },
}

/* ── stat card ────────────────────────────────────────────────────────────── */

function StatCard({ label, value, icon: Icon, color, bg, border, sub }: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; color: string; bg: string; border: string
}) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 14, padding: '20px 20px' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={17} color={color} />
      </div>
      <p style={{ fontSize: 30, fontWeight: 900, color: '#0f0c29', lineHeight: 1, marginBottom: 4, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>{value}</p>
      <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: color, fontWeight: 600, marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

/* ── section label ────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', color: '#6366f1', marginBottom: 14 }}>{children}</div>
}

/* ── page ─────────────────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const user = await getOrCreateDbUser()
  if (!user) redirect('/sign-in')

  const firstName = user.name ? user.name.split(' ')[0] : null

  const [
    contentCount, memoryCount, todayBriefing, todayIdeas,
    topicList, hookList, questionList, segmentList,
  ] = await Promise.all([
    getContentCount(user.id),
    getMemoryCount(user.id),
    getTodayBriefing(user.id),
    getTodayIdeas(user.id),
    getTopics(user.id, 16),
    getHooks(user.id, 6),
    getOpenQuestions(user.id, 4),
    getAudienceSegments(user.id),
  ])

  const gapTopics    = topicList.filter(t => t.hasGap).slice(0, 4)
  const strongTopics = topicList.filter(t => !t.hasGap).slice(0, 12)
  const isEmpty      = contentCount === 0

  return (
    <>
      <Header title={<Greeting name={firstName} />} description={formatDate(new Date())} />

      <div style={{ flex: 1, padding: '28px', maxWidth: 920, display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {isEmpty && (
          <div style={{ background: '#fff', border: '2px dashed #c4b5fd', borderRadius: 16, padding: '52px 40px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#ede9fe', border: '1px solid #c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Brain size={28} color="#4f46e5" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f0c29', marginBottom: 10, letterSpacing: '-0.3px' }}>Your knowledge graph is empty</h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 26px' }}>
              Import your LinkedIn export, Medium articles, or any content to unlock your personal intelligence dashboard.
            </p>
            <Link href="/import" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#4f46e5', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
              <Upload size={15} /> Import your content
            </Link>
          </div>
        )}

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        {!isEmpty && (
          <div>
            <SectionLabel>Your knowledge graph</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
              <StatCard label="Posts in memory"   value={contentCount}     icon={FileText}   color="#4f46e5" bg="#ede9fe" border="#c4b5fd" />
              <StatCard label="Knowledge entries" value={memoryCount}      icon={Brain}      color="#7c3aed" bg="#f3e8ff" border="#d8b4fe" />
              <StatCard label="Topics mapped"     value={topicList.length} icon={TrendingUp} color="#0891b2" bg="#e0f2fe" border="#7dd3fc"
                sub={gapTopics.length ? `${gapTopics.length} gap${gapTopics.length > 1 ? 's' : ''} found` : undefined} />
              <StatCard label="Audience segments" value={segmentList.length} icon={Users}   color="#059669" bg="#ecfdf5" border="#6ee7b7" />
            </div>
          </div>
        )}

        {/* ── Today's status ────────────────────────────────────────────────── */}
        {!isEmpty && (
          <div>
            <SectionLabel>Today</SectionLabel>
            {todayBriefing ? (
              <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 14, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={14} color="#fbbf24" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f0c29' }}>Today's briefing is ready</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 20 }}>
                    {todayIdeas.length} idea{todayIdeas.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7, marginBottom: 16 }}>{todayBriefing.summary}</p>
                <Link href="/briefing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #e0e7ff', color: '#4f46e5', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', background: '#fafbff' }}>
                  View all ideas <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)', border: '1px solid rgba(165,180,252,0.15)', borderRadius: 14, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Sparkles size={14} color="#a78bfa" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: 1 }}>READY</span>
                  </div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Generate today's briefing</h2>
                  <p style={{ fontSize: 13, color: 'rgba(165,180,252,0.7)' }}>
                    {memoryCount} knowledge entries loaded. AI-ranked ideas for {formatDate(new Date())}.
                  </p>
                </div>
                <Link href="/briefing" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: '#4f46e5', color: '#fff', borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: 'none', flexShrink: 0, boxShadow: '0 0 24px rgba(99,102,241,0.45)', whiteSpace: 'nowrap' }}>
                  Generate briefing <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Content DNA ───────────────────────────────────────────────────── */}
        {strongTopics.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Topics */}
            <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f4ff', background: '#fafbff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={14} color="#4f46e5" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>Your content DNA</span>
              </div>
              <div style={{ padding: '18px 20px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {strongTopics.map((t, i) => {
                  const c = TOPIC_COLORS[i % TOPIC_COLORS.length]
                  return (
                    <span key={t.id} style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                      {t.name}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Gap opportunities */}
            <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f4ff', background: '#fafbff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={14} color="#d97706" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>Content gaps found</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>topics you under-cover</span>
              </div>
              <div style={{ padding: '18px 20px' }}>
                {gapTopics.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {gapTopics.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#0f0c29', fontWeight: 600 }}>{t.name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 12 }}>Gap</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                    No gaps detected yet. Import more content so CreatorGraph can compare your coverage against your audience's questions.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Hooks + Questions ─────────────────────────────────────────────── */}
        {(hookList.length > 0 || questionList.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Hooks */}
            {hookList.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #1e1b4b 100%)', border: '1px solid rgba(165,180,252,0.12)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(165,180,252,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={14} color="#fbbf24" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Your strongest hooks</span>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {hookList.map(h => {
                    const c = HOOK_TYPE_COLORS[h.hookType ?? ''] ?? { bg: '#f5f3ff', color: '#5b21b6' }
                    return (
                      <div key={h.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, padding: '2px 8px', borderRadius: 10, alignSelf: 'flex-start', textTransform: 'capitalize' }}>
                          {(h.hookType ?? 'hook').replace(/_/g, ' ')}
                        </span>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, margin: 0 }}>
                          {h.text.length > 120 ? h.text.slice(0, 117) + '…' : h.text}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Open questions */}
            {questionList.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f4ff', background: '#fafbff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lightbulb size={14} color="#7c3aed" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>Open audience questions</span>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {questionList.map(q => (
                    <div key={q.id} style={{ borderLeft: '3px solid #c4b5fd', paddingLeft: 12 }}>
                      <p style={{ fontSize: 13, color: '#0f0c29', fontWeight: 600, lineHeight: 1.5, marginBottom: 3 }}>
                        {q.question.length > 100 ? q.question.slice(0, 97) + '…' : q.question}
                      </p>
                      {q.painPoint && (
                        <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{q.painPoint}</p>
                      )}
                    </div>
                  ))}
                  <Link href="/memory" style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    View all in memory <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Audience segments ────────────────────────────────────────────── */}
        <AudienceSegmentsCard
          initialSegments={segmentList}
          questions={questionList}
        />

      </div>
    </>
  )
}
