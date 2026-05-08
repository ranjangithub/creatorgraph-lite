import { getOrCreateDbUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { IdeaCard } from '@/components/briefing/idea-card'
import { getTodayBriefing } from '@/lib/db/queries/briefings'
import { getTodayIdeas } from '@/lib/db/queries/ideas'
import { getMemoryCount } from '@/lib/db/queries/memory'
import { GenerateBriefingButton } from '@/components/briefing/generate-button'
import { Brain, Zap } from 'lucide-react'

export default async function BriefingPage() {
  const user = await getOrCreateDbUser()
  if (!user) redirect('/sign-in')

  const [briefing, ideas, memoryCount] = await Promise.all([
    getTodayBriefing(user.id),
    getTodayIdeas(user.id),
    getMemoryCount(user.id),
  ])

  return (
    <>
      <Header title="Daily briefing" description="Evidence-backed content ideas from your knowledge graph" />

      <div style={{ flex: 1, padding: '28px', maxWidth: 680 }}>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#6366f1', marginBottom: 20 }}>Today's briefing</div>

        {!briefing ? (
          <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 14, padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#ede9fe', border: '1px solid #c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Brain size={24} color="#4f46e5" />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f0c29', marginBottom: 8 }}>Generate today's briefing</h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, maxWidth: 360, margin: '0 auto 24px' }}>
              {memoryCount} memory entries loaded. CreatorGraph will analyse your history and suggest 3–5 content ideas.
            </p>
            <GenerateBriefingButton />
          </div>
        ) : (
          <>
            {/* Insight card */}
            <div style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)', border: '1px solid rgba(165,180,252,0.15)', borderRadius: 14, padding: '24px 24px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Zap size={14} color="#fbbf24" />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#fbbf24' }}>Today's insight</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.75 }}>{briefing.summary}</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(165,180,252,0.1)' }}>
                <span style={{ fontSize: 12, color: 'rgba(165,180,252,0.5)' }}>{memoryCount} memory entries</span>
                <span style={{ fontSize: 12, color: 'rgba(165,180,252,0.3)' }}>·</span>
                <span style={{ fontSize: 12, color: 'rgba(165,180,252,0.5)' }}>Context: {briefing.contextUsed}</span>
              </div>
            </div>

            {/* Ideas */}
            {ideas.length > 0 ? (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#6366f1', marginBottom: 16 }}>
                  {ideas.length} idea{ideas.length !== 1 ? 's' : ''} — ranked by validation score
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {ideas
                    .sort((a, b) => (b.validationScore ?? 0) - (a.validationScore ?? 0))
                    .map(idea => <IdeaCard key={idea.id} idea={idea} />)
                  }
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>No ideas generated yet.</p>
            )}
          </>
        )}

      </div>
    </>
  )
}
