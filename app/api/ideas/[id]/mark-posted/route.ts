import { NextResponse } from 'next/server'
import { getOrCreateDbUser } from '@/lib/auth'
import { db, ideas } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { recordPostPerformance } from '@/lib/db/queries/analytics'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const likes       = Number(body.likes)       || 0
  const comments    = Number(body.comments)    || 0
  const shares      = Number(body.shares)      || 0
  const saves       = Number(body.saves)       || 0
  const impressions = Number(body.impressions) || 0

  // Verify idea belongs to this user
  const [idea] = await db.select()
    .from(ideas)
    .where(and(eq(ideas.id, id), eq(ideas.userId, user.id)))

  const platform = body.platform ?? (idea?.targetPlatforms?.[0] ?? 'linkedin')

  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })

  // Mark as published
  await db.update(ideas)
    .set({ status: 'published', actedAt: new Date() })
    .where(eq(ideas.id, id))

  // Record performance
  const perf = await recordPostPerformance({
    userId:      user.id,
    ideaId:      id,
    platform,
    likes,
    comments,
    shares,
    saves,
    impressions,
    hookType:    idea.hookType,
  })

  return NextResponse.json({ ok: true, engagementScore: perf.engagementScore })
}
