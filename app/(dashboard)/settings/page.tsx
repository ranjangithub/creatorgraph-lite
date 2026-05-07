import { getServerAuth, getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getUserByClerkId } from '@/lib/db/queries/users'
import { getContentCount } from '@/lib/db/queries/content'
import { getMemoryCount } from '@/lib/db/queries/memory'
import { UserButton } from '@clerk/nextjs'
import { MOCK_AUTH } from '@/lib/auth'

export default async function SettingsPage() {
  const { clerkId } = await getServerAuth()
  if (!clerkId) redirect('/sign-in')

  const [user, clerkUser] = await Promise.all([
    getUserByClerkId(clerkId),
    getCurrentUser(),
  ])
  if (!user) redirect('/sign-in')

  const [contentCount, memoryCount] = await Promise.all([
    getContentCount(user.id),
    getMemoryCount(user.id),
  ])

  return (
    <>
      <Header title="Settings" description="Account and data preferences" />

      <div className="flex-1 p-6 max-w-2xl space-y-5">

        {/* Account */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>Managed by Clerk — click the avatar to update</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            {!MOCK_AUTH && <UserButton />}
            <div>
              <p className="text-sm font-medium text-slate-900">{clerkUser?.fullName ?? 'Anonymous'}</p>
              <p className="text-sm text-slate-500">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </CardContent>
        </Card>

        {/* Data stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your data</CardTitle>
            <CardDescription>What CreatorGraph knows about you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Posts imported</span>
              <span className="font-semibold text-slate-900">{contentCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Memory entries</span>
              <span className="font-semibold text-slate-900">{memoryCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Stack info */}
        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stack</CardTitle>
            <CardDescription>How this app is built</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p><span className="font-medium text-slate-800">Auth:</span> Clerk</p>
            <p><span className="font-medium text-slate-800">Database:</span> Supabase (Postgres) + Drizzle ORM</p>
            <p><span className="font-medium text-slate-800">AI:</span> Anthropic Claude (claude-3-5-haiku-20241022)</p>
            <p><span className="font-medium text-slate-800">Framework:</span> Next.js 15 App Router</p>
            <p><span className="font-medium text-slate-800">Context strategy:</span> Karpathy LLM Wiki — pre-compiled markdown, no RAG</p>
          </CardContent>
        </Card>

      </div>
    </>
  )
}
