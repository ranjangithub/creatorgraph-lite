import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { IdeaCard } from '@/components/briefing/idea-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUserByClerkId } from '@/lib/db/queries/users'
import { getTodayBriefing } from '@/lib/db/queries/briefings'
import { getTodayIdeas } from '@/lib/db/queries/ideas'
import { getMemoryCount } from '@/lib/db/queries/memory'
import { GenerateBriefingButton } from '@/components/briefing/generate-button'
import { Brain, Zap } from 'lucide-react'

export default async function BriefingPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await getUserByClerkId(clerkId)
  if (!user) redirect('/sign-in')

  const [briefing, ideas, memoryCount] = await Promise.all([
    getTodayBriefing(user.id),
    getTodayIdeas(user.id),
    getMemoryCount(user.id),
  ])

  return (
    <>
      <Header title="Daily briefing" description="Evidence-backed content ideas from your memory" />

      <div className="flex-1 p-6 max-w-2xl space-y-5">

        {!briefing ? (
          /* No briefing yet */
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-7 text-center">
              <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                <Brain size={20} className="text-primary" />
              </div>
              <h2 className="font-semibold text-slate-900 mb-1">Generate today's briefing</h2>
              <p className="text-sm text-slate-500 mb-5">
                {memoryCount} memory entries loaded. CreatorGraph will analyse your history and suggest your next 3-5 content ideas.
              </p>
              <GenerateBriefingButton />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Briefing summary */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={15} className="text-amber-500" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Today's insight</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{briefing.summary}</p>
                <p className="text-xs text-slate-400 mt-3">
                  Context used: {briefing.contextUsed} · {memoryCount} memory entries
                </p>
              </CardContent>
            </Card>

            {/* Ideas */}
            {ideas.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {ideas.length} idea{ideas.length !== 1 ? 's' : ''} — ranked by validation score
                </p>
                {ideas
                  .sort((a, b) => (b.validationScore ?? 0) - (a.validationScore ?? 0))
                  .map(idea => <IdeaCard key={idea.id} idea={idea} />)
                }
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No ideas generated yet.</p>
            )}
          </>
        )}

      </div>
    </>
  )
}
