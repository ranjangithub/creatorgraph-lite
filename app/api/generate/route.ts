import { NextResponse } from 'next/server'
import { getOrCreateDbUser } from '@/lib/auth'
import { anthropic, MODEL, MAX_TOKENS, isMockMode } from '@/lib/anthropic/client'
import { getPromptTemplate, saveGeneratedDraft } from '@/lib/db/queries/prompts'
import { db, ideas, contentItems } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { getPlatformAdapter } from '@/lib/platforms/registry'
import type { Platform, ContentType } from '@/lib/platforms/types'

const MOCK_DRAFT: Record<string, string> = {
  linkedin: `Most people treat content strategy as a calendar problem.

It's not. It's a knowledge problem.

You don't have a posting frequency issue.
You have a "what do I actually know that others don't?" issue.

The best LinkedIn posts I've seen share one thing:
Specific experience. Not generic advice.

"Build in public" is cliché.
"Here's what broke at 10,000 users that no one warned me about" is a post.

Specificity is the unlock.

What's the most specific thing you know that you haven't written about yet?`,
  instagram: `Slide 1: Most creators post daily. Few post memorably.

Slide 2: The difference? Specificity.

Slide 3: Generic: "Be consistent." Specific: "Post every Tuesday at 9am for 6 months — here's what happened."

Slide 4: Generic: "Add value." Specific: "The one framework that 3x'd my saves."

Slide 5: Specific content gets saved. Saved content gets reach.

Slide 6: Your next post: replace one generic claim with a real number or real story.

Caption: Saves > likes. Always.`,
  youtube: `Title: "Why Your Content Isn't Growing (It's Not What You Think)"

Thumbnail angle: Split screen — "Posting every day" vs "Posted once, 1M views"

Opening hook (45 seconds): "I posted 200 videos in a year and grew by 340 subscribers. Then I took 3 months off, came back with one video, and got 50,000. Here's what I figured out — and it's the opposite of everything the algorithm gurus are telling you."

Outline:
1. The consistency myth — data from 500 channels
2. What actually drives growth (hint: it's the idea, not the frequency)
3. The "1 great vs 30 good" experiment
4. How to find your one great idea
5. My exact framework for validating before you film`,
}

export async function POST(req: Request) {
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { ideaId, templateId, platform = 'linkedin', contentType = 'post' } = body

  // Load idea
  const [idea] = await db.select().from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.userId, user.id)))
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })

  // Load template
  const template = templateId ? await getPromptTemplate(templateId, user.id) : null

  // Load recent content for context (last 5 posts on this platform)
  const recentContent = await db.select({ title: contentItems.title, body: contentItems.body })
    .from(contentItems)
    .where(and(eq(contentItems.userId, user.id), eq(contentItems.platform, platform as Platform)))
    .orderBy(desc(contentItems.publishedAt))
    .limit(5)

  const contextBlock = recentContent.length
    ? recentContent.map(c => `- ${c.title ?? ''}: ${c.body.slice(0, 300)}`).join('\n')
    : 'No past content imported yet.'

  const adapter  = getPlatformAdapter(platform as Platform)
  const hints    = adapter.getBriefingHints(contentType as ContentType)
  const hashtags = template?.hashtags ?? []

  if (isMockMode) {
    const draft = MOCK_DRAFT[platform] ?? MOCK_DRAFT.linkedin
    const saved = await saveGeneratedDraft({
      userId: user.id, ideaId, promptTemplateId: templateId,
      platform, contentType, draft, hashtags,
    })
    return NextResponse.json({ draft, hashtags, draftId: saved.id })
  }

  // Build the prompt
  const voiceBlock = [
    template?.brandVoice       && `Voice: ${template.brandVoice}`,
    template?.toneInstructions && `Tone: ${template.toneInstructions}`,
  ].filter(Boolean).join('\n')

  const formatBlock = template?.formatInstructions
    ? `Format instructions:\n${template.formatInstructions}`
    : hints

  const hashtagBlock = hashtags.length
    ? `Include these hashtags at the end: ${hashtags.join(' ')}`
    : ''

  const customBlock = template?.customPrompt || ''

  const prompt = `You are generating ${contentType} content for ${adapter.label}.

${voiceBlock}

Platform context:
${hints}

${formatBlock}

Recent content by this creator (for voice + topic context):
${contextBlock}

Idea to write about:
Title: ${idea.title}
Hook: ${idea.hook ?? 'None provided'}
Rationale: ${idea.rationale}
${idea.audienceFit ? `Audience: ${idea.audienceFit}` : ''}

${customBlock}

${hashtagBlock}

Write the ${contentType} now. Output only the final ready-to-post text — no preamble, no "here's your post:", no explanation.`

  const message = await anthropic.messages.create({
    model:      MODEL,
    max_tokens: MAX_TOKENS,
    messages:   [{ role: 'user', content: prompt }],
  })

  const draft = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  const saved = await saveGeneratedDraft({
    userId: user.id, ideaId, promptTemplateId: templateId,
    platform, contentType, draft, hashtags,
  })

  return NextResponse.json({ draft, hashtags, draftId: saved.id })
}
