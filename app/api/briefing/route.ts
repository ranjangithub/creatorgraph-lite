import { getServerAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { db, users, briefings, ideas } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { buildCreatorContext } from '@/lib/anthropic/context/loader'
import { generateBriefing } from '@/lib/anthropic/prompts/briefing'

export async function POST() {
  const { clerkId } = await getServerAuth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Build context from memory — this is the Context Engineering step
  const ctx = await buildCreatorContext(user.id)

  // Generate briefing using loaded context
  const result = await generateBriefing(ctx)

  // Persist briefing
  const today = new Date().toISOString().split('T')[0]
  const [briefing] = await db.insert(briefings).values({
    userId:      user.id,
    date:        today,
    summary:     result.summary,
    contextUsed: `memory:${ctx.memoryBlock.length}chars posts:${ctx.recentContent.length}chars`,
  }).returning()

  // Persist each idea
  const savedIdeas = await Promise.all(
    result.ideas.map(idea =>
      db.insert(ideas).values({
        userId:          user.id,
        title:           idea.title,
        hook:            idea.hook,
        rationale:       idea.rationale,
        audienceFit:     idea.audienceFit,
        competitorGap:   idea.competitorGap,
        repetitionRisk:  idea.repetitionRisk,
        validationScore: idea.validationScore,
      }).returning()
    )
  )

  return NextResponse.json({
    briefing,
    ideas:        savedIdeas.flat(),
    tokenEstimate: ctx.tokenEstimate,
  })
}
