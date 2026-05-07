import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, pgEnum, unique } from 'drizzle-orm/pg-core'

// ── Enums ──────────────────────────────────────────────────────────────────

export const contentPlatformEnum = pgEnum('content_platform', [
  'linkedin', 'youtube', 'tiktok', 'instagram', 'email', 'document', 'other'
])

export const ideaStatusEnum = pgEnum('idea_status', [
  'suggested', 'accepted', 'rejected', 'published', 'archived'
])

export const importStatusEnum = pgEnum('import_status', [
  'pending', 'processing', 'completed', 'failed'
])

// ── Users ──────────────────────────────────────────────────────────────────
// Synced from Clerk via webhook. clerk_id is the source of truth for auth.

export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  clerkId:   text('clerk_id').notNull().unique(),
  email:     text('email').notNull(),
  name:      text('name'),
  imageUrl:  text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Content Items ──────────────────────────────────────────────────────────
// Every piece of content a creator has ever published, imported from any platform.

export const contentItems = pgTable('content_items', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform:     contentPlatformEnum('platform').notNull(),
  externalId:   text('external_id'),               // Platform's own ID
  title:        text('title'),
  body:         text('body').notNull(),             // Full text content
  url:          text('url'),
  publishedAt:  timestamp('published_at'),
  // Performance signals
  views:        integer('views').default(0),
  likes:        integer('likes').default(0),
  comments:     integer('comments').default(0),
  shares:       integer('shares').default(0),
  // Extracted by LLM
  topics:       jsonb('topics').$type<string[]>().default([]),
  hooks:        jsonb('hooks').$type<string[]>().default([]),
  summary:      text('summary'),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
})

// ── Memory Entries ─────────────────────────────────────────────────────────
// Append-only. Past knowledge is never overwritten — only added to.
// This is the Karpathy LLM Wiki pattern applied to creator history.

export const memoryEntries = pgTable('memory_entries', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // What was learned
  type:      text('type').notNull(),  // 'topic_expertise' | 'audience_question' | 'abandoned_idea' | 'voice_pattern' | 'competitor_gap'
  content:   text('content').notNull(),
  evidence:  jsonb('evidence').$type<string[]>().default([]),  // content item IDs that support this memory
  // Metadata
  confidence: integer('confidence').default(80),  // 0-100
  tags:       jsonb('tags').$type<string[]>().default([]),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  // Never update — append only. New insight = new row.
})

// ── Ideas ──────────────────────────────────────────────────────────────────
// Content ideas suggested by the system, with full audit trail.

export const ideas = pgTable('ideas', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title:           text('title').notNull(),
  hook:            text('hook'),
  rationale:       text('rationale').notNull(),   // Why now, why you
  audienceFit:     text('audience_fit'),
  competitorGap:   text('competitor_gap'),
  repetitionRisk:  text('repetition_risk'),        // "New angle" | "Sequel" | "REPEAT — do not use"
  validationScore: integer('validation_score'),    // 0-100, is this worth pursuing?
  status:          ideaStatusEnum('status').default('suggested').notNull(),
  rejectionReason: text('rejection_reason'),
  suggestedAt:     timestamp('suggested_at').defaultNow().notNull(),
  actedAt:         timestamp('acted_at'),
})

// ── Briefings ─────────────────────────────────────────────────────────────
// Daily content briefings generated from memory.

export const briefings = pgTable('briefings', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date:        text('date').notNull(),             // YYYY-MM-DD
  summary:     text('summary').notNull(),
  ideaIds:     jsonb('idea_ids').$type<string[]>().default([]),
  contextUsed: text('context_used'),               // Which memory entries were loaded
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})

// ── Imports ────────────────────────────────────────────────────────────────
// Tracks data import jobs (LinkedIn export, document uploads, etc.)

export const imports = pgTable('imports', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform:     contentPlatformEnum('platform').notNull(),
  status:       importStatusEnum('status').default('pending').notNull(),
  fileName:     text('file_name'),
  fileUrl:      text('file_url'),                  // Supabase storage URL
  itemsFound:   integer('items_found').default(0),
  itemsImported: integer('items_imported').default(0),
  error:        text('error'),
  startedAt:    timestamp('started_at').defaultNow().notNull(),
  completedAt:  timestamp('completed_at'),
})

// ── Competitors ────────────────────────────────────────────────────────────

export const competitors = pgTable('competitors', {
  id:       uuid('id').primaryKey().defaultRandom(),
  userId:   uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:     text('name').notNull(),
  platform: contentPlatformEnum('platform').notNull(),
  handle:   text('handle').notNull(),
  notes:    text('notes'),
  addedAt:  timestamp('added_at').defaultNow().notNull(),
})

// ── Knowledge Graph ────────────────────────────────────────────────────────
// The structured memory layer — nodes extracted from content, typed by role.
// Creator --CREATED--> ContentItem --COVERS--> Topic
//                                 --USES-----> Hook
//                                 --GENERATED-> AudienceQuestion
// AudienceSegment --ASKED--> AudienceQuestion
// Hook --PERFORMS_WELL_WITH--> AudienceSegment

// Node: Topic / Theme
// Specific and higher-order concepts the creator covers.
// parentId links sub-topics to their parent (e.g. "platform engineering" → "software engineering").
// hasGap = true means audience asks about this but creator hasn't addressed it.

export const topics = pgTable('topics', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:       text('name').notNull(),
  parentId:   uuid('parent_id'),                // higher-order topic
  hasGap:     boolean('has_gap').default(false), // audience wants this, creator hasn't covered it
  confidence: integer('confidence').default(80), // 0-100
  createdAt:  timestamp('created_at').defaultNow().notNull(),
}, t => ({ uniq: unique().on(t.userId, t.name) }))

// Node: Hook / Analogy
// Reusable creative assets extracted from content.
// type: 'analogy' | 'framework' | 'opener' | 'statistic' | 'question'

export const hooks = pgTable('hooks', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  text:       text('text').notNull(),
  hookType:   text('hook_type').notNull(),       // analogy | framework | opener | statistic | question
  confidence: integer('confidence').default(80),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
})

// Node: AudienceSegment
// Groups of people who engage with the creator's content.

export const audienceSegments = pgTable('audience_segments', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),             // "CTOs" | "founders" | "students"
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => ({ uniq: unique().on(t.userId, t.name) }))

// Node: AudienceQuestion
// Questions and objections extracted from comments or implied by content.
// resolved = false means the creator has never directly answered this.

export const audienceQuestions = pgTable('audience_questions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  question:  text('question').notNull(),
  painPoint: text('pain_point'),                 // underlying frustration or need
  segments:  jsonb('segments').$type<string[]>().default([]),  // which audience segments asked
  resolved:  boolean('resolved').default(false), // has the creator addressed this?
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
