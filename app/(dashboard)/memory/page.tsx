import { getOrCreateDbUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { getTopics, getHooks, getOpenQuestions, getAudienceSegments } from '@/lib/db/queries/graph'
import { Brain, Lightbulb, Users, HelpCircle } from 'lucide-react'

const sectionStyle = (border: string): React.CSSProperties => ({
  background: '#fff',
  border: `1px solid ${border}`,
  borderRadius: 14,
  overflow: 'hidden',
})

const sectionHeader = (bg: string, border: string): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '16px 22px',
  borderBottom: `1px solid ${border}`,
  background: bg,
})

const sectionBody: React.CSSProperties = { padding: '18px 22px' }

const chip = (bg: string, color: string, border: string): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: 12,
  fontWeight: 600,
  padding: '4px 12px',
  borderRadius: 20,
  background: bg,
  color,
  border: `1px solid ${border}`,
})

export default async function MemoryPage() {
  const user = await getOrCreateDbUser()
  if (!user) redirect('/sign-in')

  const [topicList, hookList, questionList, segmentList] = await Promise.all([
    getTopics(user.id, 100),
    getHooks(user.id, 50),
    getOpenQuestions(user.id, 50),
    getAudienceSegments(user.id),
  ])

  const totalEntities = topicList.length + hookList.length + questionList.length + segmentList.length
  const expertTopics  = topicList.filter(t => !t.hasGap)
  const gapTopics     = topicList.filter(t => t.hasGap)

  const hooksByType = hookList.reduce<Record<string, typeof hookList>>((acc, h) => {
    if (!acc[h.hookType]) acc[h.hookType] = []
    acc[h.hookType].push(h)
    return acc
  }, {})

  return (
    <>
      <Header
        title="Knowledge graph"
        description={`${totalEntities} graph entities — topics, hooks, audience, open questions`}
      />

      <div style={{ flex: 1, padding: '28px', maxWidth: 800 }}>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#6366f1', marginBottom: 20 }}>Knowledge graph</div>

        {totalEntities === 0 ? (
          <div style={{ background: '#fff', border: '1px dashed #c4b5fd', borderRadius: 14, padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#ede9fe', border: '1px solid #c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Brain size={24} color="#4f46e5" />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f0c29', marginBottom: 8 }}>Graph is empty</h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, maxWidth: 360, margin: '0 auto' }}>
              Import your content to build the knowledge graph. Each post is analysed for topics, hooks, audience segments, and open questions.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Topics */}
            {topicList.length > 0 && (
              <div style={sectionStyle('#c4b5fd')}>
                <div style={sectionHeader('#faf5ff', '#ede9fe')}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#ede9fe', border: '1px solid #c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={14} color="#7c3aed" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7c3aed' }}>Topics — Creator covers</div>
                  </div>
                </div>
                <div style={sectionBody}>
                  {expertTopics.length > 0 && (
                    <div style={{ marginBottom: gapTopics.length > 0 ? 20 : 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>Expert territory</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {expertTopics.map(t => (
                          <span key={t.id} style={chip('#ede9fe', '#5b21b6', '#c4b5fd')} title={`Confidence: ${t.confidence}%`}>{t.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {gapTopics.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#d97706', marginBottom: 10 }}>↗ Gaps — audience wants this, you haven't covered it</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {gapTopics.map(t => (
                          <span key={t.id} style={chip('#fffbeb', '#92400e', '#fde68a')}>{t.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hooks */}
            {hookList.length > 0 && (
              <div style={sectionStyle('#fde68a')}>
                <div style={sectionHeader('#fffbeb', '#fef3c7')}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lightbulb size={14} color="#d97706" />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#d97706' }}>Hooks & Analogies — reusable creative assets</div>
                </div>
                <div style={sectionBody}>
                  {Object.entries(hooksByType).map(([type, items], i) => (
                    <div key={type} style={{ marginBottom: i < Object.keys(hooksByType).length - 1 ? 20 : 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>{type}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {items.map(h => (
                          <p key={h.id} style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, paddingLeft: 14, borderLeft: '3px solid #fde68a' }}>
                            {h.text}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audience */}
            {segmentList.length > 0 && (
              <div style={sectionStyle('#93c5fd')}>
                <div style={sectionHeader('#eff6ff', '#dbeafe')}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#dbeafe', border: '1px solid #93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={14} color="#2563eb" />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#2563eb' }}>Audience segments</div>
                </div>
                <div style={sectionBody}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {segmentList.map(s => (
                      <span key={s.id} style={chip('#dbeafe', '#1e40af', '#93c5fd')}>{s.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Open questions */}
            {questionList.length > 0 && (
              <div style={sectionStyle('#fca5a5')}>
                <div style={sectionHeader('#fff1f2', '#fecdd3')}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fecdd3', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HelpCircle size={14} color="#dc2626" />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#dc2626' }}>Open audience questions — not yet answered</div>
                </div>
                <div style={{ padding: '4px 0' }}>
                  {questionList.map((q, i) => (
                    <div key={q.id} style={{ padding: '16px 22px', borderBottom: i < questionList.length - 1 ? '1px solid #fff1f2' : 'none' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f0c29', lineHeight: 1.4, marginBottom: 5 }}>"{q.question}"</p>
                      {q.painPoint && <p style={{ fontSize: 12, color: '#94a3b8' }}>Pain point: {q.painPoint}</p>}
                      {(q.segments as string[]).length > 0 && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          {(q.segments as string[]).map(seg => (
                            <span key={seg} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{seg}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  )
}
