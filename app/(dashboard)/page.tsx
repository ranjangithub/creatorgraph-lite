import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserByClerkId } from '@/lib/db/queries/users'
import { getContentCount } from '@/lib/db/queries/content'
import { getMemoryCount } from '@/lib/db/queries/memory'
import { getTodayBriefing } from '@/lib/db/queries/briefings'
import { getTodayIdeas } from '@/lib/db/queries/ideas'
import { formatDate } from '@/lib/utils'
import { Brain, FileText, Lightbulb, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function OverviewPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await getUserByClerkId(clerkId)
  if (!user) redirect('/sign-in')

  const [contentCount, memoryCount, todayBriefing, todayIdeas] = await Promise.all([
    getContentCount(user.id),
    getMemoryCount(user.id),
    getTodayBriefing(user.id),
    getTodayIdeas(user.id),
  ])

  const stats = [
    { label: 'Posts imported',    value: contentCount, icon: FileText,   color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Memory entries',    value: memoryCount,  icon: Brain,      color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Ideas today',       value: todayIdeas.length, icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Briefings run',     value: todayBriefing ? 1 : 0, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <>
      <Header
        title={`Good morning${user.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description={formatDate(new Date())}
      />

      <div className="flex-1 p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                  <Icon size={18} className={color} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Getting started / Today's briefing */}
        {contentCount === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText size={22} className="text-primary" />
              </div>
              <h2 className="font-semibold text-slate-900 mb-2">Import your LinkedIn content to get started</h2>
              <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
                Download your LinkedIn data export, upload it here, and CreatorGraph will build your content memory automatically.
              </p>
              <Button asChild>
                <Link href="/import">Import LinkedIn posts →</Link>
              </Button>
            </CardContent>
          </Card>
        ) : todayBriefing ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Today's briefing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">{todayBriefing.summary}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/briefing">View all ideas →</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900 mb-1">Ready for today's briefing</h2>
                <p className="text-sm text-slate-500">
                  {memoryCount} memory entries loaded. Generate your content ideas for {formatDate(new Date())}.
                </p>
              </div>
              <Button asChild>
                <Link href="/briefing">Generate briefing →</Link>
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </>
  )
}
