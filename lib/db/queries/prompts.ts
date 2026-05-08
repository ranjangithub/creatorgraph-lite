import { db, promptTemplates, generatedDrafts } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'

// ── Default templates seeded for every new user ───────────────────────────

const DEFAULTS = [
  {
    name:               'LinkedIn — Bold Take',
    platform:           'linkedin' as const,
    contentType:        'post' as const,
    toneInstructions:   'Direct, first-person, opinionated. Short punchy sentences. No corporate speak.',
    brandVoice:         'Write as a practitioner who has real opinions formed from real experience.',
    formatInstructions: 'Open with a bold claim or contrarian statement. Use line breaks — no walls of text. Max 1,200 chars. End with a question to drive comments.',
    hashtags:           ['#buildinpublic', '#leadership', '#productthinking'],
    customPrompt:       '',
    isDefault:          true,
  },
  {
    name:               'LinkedIn — Thought Leadership Article',
    platform:           'linkedin' as const,
    contentType:        'article' as const,
    toneInstructions:   'Authoritative but approachable. Substantiated with data or personal examples.',
    brandVoice:         'Write as someone who has seen the landscape evolve and has earned the right to have a take.',
    formatInstructions: 'Structure: hook paragraph → 3 key points (each with a subheading) → actionable takeaway. 600–900 words.',
    hashtags:           ['#thoughtleadership', '#strategy', '#futureofwork'],
    customPrompt:       '',
    isDefault:          true,
  },
  {
    name:               'Instagram — Carousel',
    platform:           'instagram' as const,
    contentType:        'carousel' as const,
    toneInstructions:   'Conversational, warm, visual-friendly. Short sentences.',
    brandVoice:         'Write like a knowledgeable friend sharing a discovery, not a brand pushing content.',
    formatInstructions: 'Output slide-by-slide: Slide 1 = hook promise, Slides 2–7 = one insight each (10–15 words), Slide 8 = summary + CTA. Caption under 150 chars.',
    hashtags:           ['#contentcreator', '#growthmindset', '#learnfromme'],
    customPrompt:       '',
    isDefault:          true,
  },
  {
    name:               'YouTube — Video Script Hook',
    platform:           'youtube' as const,
    contentType:        'video' as const,
    toneInstructions:   'Energetic, curiosity-driven. Hook hard in the first 30 seconds.',
    brandVoice:         'Write like an expert who genuinely wants the viewer to stick around because the content is worth it.',
    formatInstructions: 'Output: (1) Title (curiosity-gap, under 60 chars) (2) Thumbnail angle suggestion (3) Opening 45-second hook script (4) 5-point video outline.',
    hashtags:           [],
    customPrompt:       '',
    isDefault:          true,
  },
]

export async function getUserPromptTemplates(userId: string) {
  return db.select().from(promptTemplates)
    .where(eq(promptTemplates.userId, userId))
    .orderBy(desc(promptTemplates.isDefault), desc(promptTemplates.createdAt))
}

// Seed default templates if user has none yet
export async function ensureDefaultTemplates(userId: string) {
  const existing = await getUserPromptTemplates(userId)
  if (existing.length > 0) return existing

  const rows = await db.insert(promptTemplates)
    .values(DEFAULTS.map(t => ({ ...t, userId })))
    .returning()
  return rows
}

export async function getPromptTemplate(id: string, userId: string) {
  const [row] = await db.select().from(promptTemplates)
    .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)))
  return row ?? null
}

export async function createPromptTemplate(userId: string, data: {
  name:               string
  platform:           string
  contentType:        string
  toneInstructions?:  string
  brandVoice?:        string
  formatInstructions?:string
  hashtags?:          string[]
  customPrompt?:      string
}) {
  const [row] = await db.insert(promptTemplates).values({
    userId,
    name:               data.name,
    platform:           data.platform as typeof promptTemplates.$inferInsert['platform'],
    contentType:        data.contentType as typeof promptTemplates.$inferInsert['contentType'],
    toneInstructions:   data.toneInstructions,
    brandVoice:         data.brandVoice,
    formatInstructions: data.formatInstructions,
    hashtags:           data.hashtags ?? [],
    customPrompt:       data.customPrompt,
  }).returning()
  return row
}

export async function updatePromptTemplate(id: string, userId: string, data: Partial<{
  name:               string
  platform:           typeof promptTemplates.$inferInsert['platform']
  contentType:        typeof promptTemplates.$inferInsert['contentType']
  toneInstructions:   string
  brandVoice:         string
  formatInstructions: string
  hashtags:           string[]
  customPrompt:       string
}>) {
  const [row] = await db.update(promptTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)))
    .returning()
  return row ?? null
}

export async function deletePromptTemplate(id: string, userId: string) {
  await db.delete(promptTemplates)
    .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)))
}

// ── Generated Drafts ──────────────────────────────────────────────────────

export async function saveGeneratedDraft(data: {
  userId:            string
  ideaId:            string
  promptTemplateId?: string
  platform:          string
  contentType:       string
  draft:             string
  hashtags:          string[]
}) {
  const [row] = await db.insert(generatedDrafts).values({
    userId:           data.userId,
    ideaId:           data.ideaId,
    promptTemplateId: data.promptTemplateId,
    platform:         data.platform as typeof generatedDrafts.$inferInsert['platform'],
    contentType:      data.contentType as typeof generatedDrafts.$inferInsert['contentType'],
    draft:            data.draft,
    hashtags:         data.hashtags,
  }).returning()
  return row
}

export async function updateDraftStatus(id: string, userId: string, status: string) {
  await db.update(generatedDrafts)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(generatedDrafts.id, id), eq(generatedDrafts.userId, userId)))
}

export async function getDraft(id: string, userId: string) {
  const [row] = await db
    .select()
    .from(generatedDrafts)
    .where(and(eq(generatedDrafts.id, id), eq(generatedDrafts.userId, userId)))
    .limit(1)
  return row ?? null
}

export async function listDrafts(userId: string, filters: {
  platform?:    string
  status?:      string
  ideaId?:      string
  limit?:       number
  offset?:      number
} = {}) {
  const { platform, status, ideaId, limit = 20, offset = 0 } = filters
  const conditions = [eq(generatedDrafts.userId, userId)]
  if (platform) conditions.push(eq(generatedDrafts.platform, platform as typeof generatedDrafts.$inferInsert['platform']))
  if (status)   conditions.push(eq(generatedDrafts.status,   status))
  if (ideaId)   conditions.push(eq(generatedDrafts.ideaId,   ideaId))

  const rows = await db
    .select()
    .from(generatedDrafts)
    .where(and(...conditions))
    .orderBy(desc(generatedDrafts.createdAt))
    .limit(limit)
    .offset(offset)
  return rows
}
