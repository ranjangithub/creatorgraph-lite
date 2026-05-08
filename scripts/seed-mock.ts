// Seed script for local mock development.
// Run after: docker compose up -d && npm run db:push
// Usage: npm run db:seed-mock

import { config } from 'dotenv'
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../lib/db/schema'
import {
  MOCK_CLERK_ID,
  MOCK_USER_EMAIL,
  MOCK_USER_NAME,
  MOCK_GRAPH_EXTRACTION,
  MOCK_CONTENT_ITEMS,
} from '../lib/mock/fixtures'

const client = postgres(process.env.DATABASE_URL!, { prepare: false })
const db     = drizzle(client, { schema })

async function seed() {
  console.log('Seeding mock data…')

  // 1. User
  const [user] = await db
    .insert(schema.users)
    .values({ clerkId: MOCK_CLERK_ID, email: MOCK_USER_EMAIL, name: MOCK_USER_NAME })
    .onConflictDoUpdate({ target: schema.users.clerkId, set: { email: MOCK_USER_EMAIL, name: MOCK_USER_NAME } })
    .returning()
  console.log(`  user: ${user.id}`)

  // 2. Content items
  const items = await db
    .insert(schema.contentItems)
    .values(MOCK_CONTENT_ITEMS.map(c => ({ ...c, userId: user.id })))
    .onConflictDoNothing()
    .returning()
  console.log(`  content items: ${items.length}`)

  // 3. Topics
  const topics = await Promise.all(
    MOCK_GRAPH_EXTRACTION.topics.map(t =>
      db.insert(schema.topics)
        .values({ userId: user.id, name: t.name, hasGap: t.hasGap, confidence: t.confidence })
        .onConflictDoUpdate({ target: [schema.topics.userId, schema.topics.name], set: { hasGap: t.hasGap } })
        .returning()
    )
  )
  console.log(`  topics: ${topics.flat().length}`)

  // 4. Hooks
  const hooks = await db
    .insert(schema.hooks)
    .values(MOCK_GRAPH_EXTRACTION.hooks.map(h => ({ userId: user.id, text: h.text, hookType: h.hookType, confidence: h.confidence })))
    .returning()
  console.log(`  hooks: ${hooks.length}`)

  // 5. Audience segments
  const segs = await Promise.all(
    MOCK_GRAPH_EXTRACTION.audienceSegments.map(name =>
      db.insert(schema.audienceSegments)
        .values({ userId: user.id, name })
        .onConflictDoUpdate({ target: [schema.audienceSegments.userId, schema.audienceSegments.name], set: { name } })
        .returning()
    )
  )
  console.log(`  audience segments: ${segs.flat().length}`)

  // 6. Audience questions
  const questions = await db
    .insert(schema.audienceQuestions)
    .values(MOCK_GRAPH_EXTRACTION.audienceQuestions.map(q => ({
      userId:    user.id,
      question:  q.question,
      painPoint: q.painPoint,
      segments:  q.segments,
      resolved:  q.resolved,
    })))
    .returning()
  console.log(`  audience questions: ${questions.length}`)

  // 7. A pre-generated briefing + ideas (so the overview page shows data immediately)
  const today = new Date().toISOString().split('T')[0]
  const [briefing] = await db
    .insert(schema.briefings)
    .values({
      userId:      user.id,
      date:        today,
      summary:     'Your knowledge graph shows strong depth in platform engineering but two open audience questions remain unanswered. The highest-value move today is addressing the platform team ROI question — your audience keeps raising it and no one in your feed is answering it from the operator perspective.',
      contextUsed: 'mock seed data',
    })
    .returning()

  const seededIdeas = await db
    .insert(schema.ideas)
    .values([
      {
        userId:          user.id,
        title:           'The Platform Team ROI Argument Your CFO Will Actually Believe',
        hook:            'Your CFO does not care about developer happiness. Here is what they do care about.',
        rationale:       'Top open question from CTOs and EMs. You have the credibility and the analogy toolkit to make it concrete.',
        audienceFit:     'CTOs and Engineering Managers justifying platform headcount in annual planning.',
        competitorGap:   'Most content on this is from vendors. You can write from the operator side.',
        repetitionRisk:  'new',
        validationScore: 91,
        status:          'suggested',
      },
      {
        userId:          user.id,
        title:           'How to Run a Platform Team Without Becoming the Team Everyone Hates',
        hook:            'Platform teams fail in one of two ways. Both are avoidable.',
        rationale:       'Directly answers the gatekeeper concern. Your 3-question framework is the backbone.',
        audienceFit:     'Staff Engineers and CTOs building or inheriting a platform org.',
        competitorGap:   'Generic best-practice posts dominate this topic. Your failure-mode angle is rare.',
        repetitionRisk:  'new',
        validationScore: 87,
        status:          'suggested',
      },
    ])
    .returning()

  console.log(`  briefing: ${briefing.id}`)
  console.log(`  ideas: ${seededIdeas.length}`)
  console.log('\nSeed complete. Run: npm run dev')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
