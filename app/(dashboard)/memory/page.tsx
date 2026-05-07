import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { getUserByClerkId } from '@/lib/db/queries/users'
import { getMemoryEntries } from '@/lib/db/queries/memory'
import { Brain } from 'lucide-react'

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  topic_expertise:   { label: 'Topic expertise',   color: 'bg-violet-50 text-violet-700 border-violet-200' },
  audience_question: { label: 'Audience question', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  voice_pattern:     { label: 'Voice pattern',     color: 'bg-amber-50 text-amber-700 border-amber-200' },
  abandoned_idea:    { label: 'Abandoned idea',    color: 'bg-slate-50 text-slate-600 border-slate-200' },
  performance_insight: { label: 'Performance',     color: 'bg-green-50 text-green-700 border-green-200' },
  competitor_gap:    { label: 'Competitor gap',    color: 'bg-red-50 text-red-700 border-red-200' },
}

export default async function MemoryPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await getUserByClerkId(clerkId)
  if (!user) redirect('/sign-in')

  const entries = await getMemoryEntries(user.id, 100)

  // Group by type
  const grouped = entries.reduce<Record<string, typeof entries>>((acc, e) => {
    const t = e.type ?? 'other'
    if (!acc[t]) acc[t] = []
    acc[t].push(e)
    return acc
  }, {})

  return (
    <>
      <Header
        title="Memory graph"
        description={`${entries.length} entries — your distilled knowledge base`}
      />

      <div className="flex-1 p-6 max-w-3xl space-y-6">

        {entries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain size={22} className="text-primary" />
              </div>
              <h2 className="font-semibold text-slate-900 mb-2">No memories yet</h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Import your content to build your memory graph. Every post you've written
                becomes structured knowledge the system can reason from.
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([type, items]) => {
            const meta = TYPE_LABELS[type] ?? { label: type, color: 'bg-slate-50 text-slate-600 border-slate-200' }
            return (
              <section key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-slate-400">{items.length} entries</span>
                </div>
                <div className="space-y-2">
                  {items.map(entry => (
                    <Card key={entry.id} className="border-slate-100">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm text-slate-700 leading-relaxed flex-1">{entry.content}</p>
                          <span className="text-xs text-slate-400 shrink-0 mt-0.5">{entry.confidence}%</span>
                        </div>
                        {entry.tags && (entry.tags as string[]).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(entry.tags as string[]).map(tag => (
                              <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )
          })
        )}

      </div>
    </>
  )
}
