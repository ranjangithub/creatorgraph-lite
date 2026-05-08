import { getOrCreateDbUser }        from '@/lib/auth'
import { NextResponse }              from 'next/server'
import { db, briefings, ideas }      from '@/lib/db'
import { buildCreatorContext }        from '@/lib/anthropic/context/loader'
import { generateBriefing }          from '@/lib/anthropic/prompts/briefing'
import { getLLMClient }              from '@/lib/ai/client'
import { LLMLimitError }             from '@/lib/ai/types'

export async function POST() {
  try {
    const user = await getOrCreateDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resolved = await getLLMClient(user.id)

    const ctx    = await buildCreatorContext(user.id)
    const result = await generateBriefing(ctx, resolved.model)

    const today = new Date().toISOString().split('T')[0]
    const [briefing] = await db.insert(briefings).values({
      userId:      user.id,
      date:        today,
      summary:     result.summary,
      contextUsed: `memory:${ctx.memoryBlock.length}chars posts:${ctx.recentContent.length}chars`,
    }).returning()

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
      ideas:         savedIdeas.flat(),
      tokenEstimate: ctx.tokenEstimate,
      provider:      resolved.provider,
      remaining:     resolved.remaining,
    })
  } catch (err) {
    if (err instanceof LLMLimitError) {
      return NextResponse.json({ error: err.message, limitReached: true }, { status: 402 })
    }
    console.error('[POST /api/briefing]', err)
    return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 })
  }
}
