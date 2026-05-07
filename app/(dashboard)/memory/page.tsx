import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserByClerkId } from '@/lib/db/queries/users'
import { getTopics, getHooks, getOpenQuestions, getAudienceSegments } from '@/lib/db/queries/graph'
import { Brain, Lightbulb, Users, HelpCircle } from 'lucide-react'

export default async function MemoryPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await getUserByClerkId(clerkId)
  if (!user) redirect('/sign-in')

  const [topicList, hookList, questionList, segmentList] = await Promise.all([
    getTopics(user.id, 100),
    getHooks(user.id, 50),
    getOpenQuestions(user.id, 50),
    getAudienceSegments(user.id),
  ])

  const totalEntities = topicList.length + hookList.length + questionList.length + segmentList.length

  const expertTopics = topicList.filter(t => !t.hasGap)
  const gapTopics    = topicList.filter(t => t.hasGap)

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

      <div className="flex-1 p-6 max-w-3xl space-y-6">

        {totalEntities === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain size={22} className="text-primary" />
              </div>
              <h2 className="font-semibold text-slate-900 mb-2">Graph is empty</h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Import your content to build the knowledge graph. Each post is analysed for
                topics, hooks, audience segments, and open questions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>

            {/* Topics */}
            {topicList.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Brain size={15} className="text-violet-600" />
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                      Topics — Creator covers
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">

                  {expertTopics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {expertTopics.map(t => (
                        <span
                          key={t.id}
                          className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-medium"
                          title={`Confidence: ${t.confidence}%`}
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {gapTopics.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 font-semibold">
                        Gaps — audience wants this, you haven't covered it
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {gapTopics.map(t => (
                          <span
                            key={t.id}
                            className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium"
                          >
                            {t.name} ↗
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            )}

            {/* Hooks */}
            {hookList.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={15} className="text-amber-500" />
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                      Hooks & Analogies — reusable creative assets
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(hooksByType).map(([type, items]) => (
                    <div key={type}>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{type}</p>
                      <div className="space-y-1.5">
                        {items.map(h => (
                          <p key={h.id} className="text-sm text-slate-700 leading-relaxed pl-3 border-l-2 border-slate-100">
                            {h.text}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Audience */}
            {segmentList.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-blue-500" />
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                      Audience segments
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {segmentList.map(s => (
                      <span key={s.id} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Open questions */}
            {questionList.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle size={15} className="text-red-400" />
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                      Open audience questions — not yet answered
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {questionList.map(q => (
                    <div key={q.id} className="pb-3 border-b border-slate-50 last:border-0">
                      <p className="text-sm font-medium text-slate-800">"{q.question}"</p>
                      {q.painPoint && (
                        <p className="text-xs text-slate-400 mt-0.5">Pain: {q.painPoint}</p>
                      )}
                      {(q.segments as string[]).length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {(q.segments as string[]).map(seg => (
                            <span key={seg} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                              {seg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

          </>
        )}
      </div>
    </>
  )
}
