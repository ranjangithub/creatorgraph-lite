import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, pgEnum, unique, real } from 'drizzle-orm/pg-core'

// ── Enums ──────────────────────────────────────────────────────────────────

export const accountTypeEnum = pgEnum('account_type', [
  'individual', 'enterprise',
])

export const orgRoleEnum = pgEnum('org_role', [
  'admin', 'editor', 'viewer',
])

export const contentPlatformEnum = pgEnum('content_platform', [
  'linkedin', 'youtube', 'tiktok', 'instagram', 'medium', 'substack', 'email', 'document', 'other',
])

export const platformEntityTypeEnum = pgEnum('platform_entity_type', [
  'personal', 'company_page', 'brand_channel',
])

export const contentTypeEnum = pgEnum('content_type', [
  'post', 'video', 'reel', 'carousel', 'article', 'short', 'story', 'newsletter',
])

export const postPurposeEnum = pgEnum('post_purpose', [
  'thought_leadership', 'product', 'culture', 'education',
  'personal_story', 'announcement', 'engagement', 'hiring',
])

export const ideaStatusEnum = pgEnum('idea_status', [
  'suggested', 'accepted', 'rejected', 'published', 'archived',
])

export const importStatusEnum = pgEnum('import_status', [
  'pending', 'processing', 'completed', 'failed',
])

// ── Organizations ──────────────────────────────────────────────────────────
// Exists for enterprise accounts. Individual creators have no org (orgId = null).

export const organizations = pgTable('organizations', {
  id:               uuid('id').primaryKey().defaultRandom(),
  name:             text('name').notNull(),
  industry:         text('industry'),
  size:             text('size'),                    // 'startup' | 'smb' | 'enterprise'
  brandVoice:       text('brand_voice'),             // "We are direct, data-driven, never salesy..."
  contentPillars:   jsonb('content_pillars').$type<string[]>().default([]),
  createdAt:        timestamp('created_at').defaultNow().notNull(),
  updatedAt:        timestamp('updated_at').defaultNow().notNull(),
})

// ── Org Members ────────────────────────────────────────────────────────────

export const orgMembers = pgTable('org_members', {
  id:        uuid('id').primaryKey().defaultRandom(),
  orgId:     uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id,  { onDelete: 'cascade' }),
  role:      orgRoleEnum('role').default('editor').notNull(),
  joinedAt:  timestamp('joined_at').defaultNow().notNull(),
}, t => ({ uniq: unique().on(t.orgId, t.userId) }))

// ── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  clerkId:            text('clerk_id').notNull().unique(),
  email:              text('email').notNull(),
  name:               text('name'),
  imageUrl:           text('image_url'),
  // Account type — individual by default, enterprise when part of an org
  accountType:        accountTypeEnum('account_type').default('individual').notNull(),
  orgId:              uuid('org_id').references(() => organizations.id, { onDelete: 'set null' }),
  // Active platforms for this user
  activePlatforms:    jsonb('active_platforms').$type<string[]>().default(['linkedin']),
  // Niche benchmarking
  niche:              text('niche'),
  shareForBenchmark:  boolean('share_for_benchmark').default(false),
  // LLM provider — 'app' = use CreatorGraph's shared key (free tier)
  llmProvider:        text('llm_provider').default('app'),   // 'app' | 'anthropic' | 'openai' | 'google'
  llmApiKey:          text('llm_api_key'),                   // AES-256-GCM encrypted
  llmModel:           text('llm_model'),                     // optional override e.g. 'gpt-4o', 'gemini-1.5-pro'
  // Free tier usage tracking — resets monthly
  monthlyUsage:       integer('monthly_usage').default(0),
  usageResetAt:       timestamp('usage_reset_at'),
  // Stripe billing
  stripeCustomerId:     text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId:        text('stripe_price_id'),
  subscriptionStatus:   text('subscription_status'),           // 'active' | 'past_due' | 'canceled' | 'trialing'
  subscriptionTier:     text('subscription_tier').default('free'), // 'free' | 'creator' | 'creator_pro' | 'enterprise'
  currentPeriodEnd:     timestamp('current_period_end'),
  createdAt:          timestamp('created_at').defaultNow().notNull(),
  updatedAt:          timestamp('updated_at').defaultNow().notNull(),
})

// ── Platform Connections ───────────────────────────────────────────────────
// One row per platform per user (or per org for enterprise).
// Tracks which handle/channel the content belongs to.

export const platformConnections = pgTable('platform_connections', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId:       uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  platform:    contentPlatformEnum('platform').notNull(),
  entityType:  platformEntityTypeEnum('entity_type').default('personal').notNull(),
  handle:      text('handle'),                      // @username or channel name
  displayName: text('display_name'),
  isActive:    boolean('is_active').default(true),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
}, t => ({ uniq: unique().on(t.userId, t.platform, t.entityType) }))

// ── Content Items ──────────────────────────────────────────────────────────
// Every piece of content a creator has ever published, across all platforms.

export const contentItems = pgTable('content_items', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId:        uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  platform:     contentPlatformEnum('platform').notNull(),
  entityType:   platformEntityTypeEnum('entity_type').default('personal').notNull(),
  contentType:  contentTypeEnum('content_type').default('post').notNull(),
  postPurpose:  postPurposeEnum('post_purpose'),
  externalId:   text('external_id'),
  title:        text('title'),
  body:         text('body').notNull(),
  url:          text('url'),
  publishedAt:  timestamp('published_at'),
  // Performance signals
  views:        integer('views').default(0),
  likes:        integer('likes').default(0),
  comments:     integer('comments').default(0),
  shares:       integer('shares').default(0),
  saves:        integer('saves').default(0),          // Instagram / YouTube
  impressions:  integer('impressions').default(0),
  // Extracted by LLM
  topics:       jsonb('topics').$type<string[]>().default([]),
  hooks:        jsonb('hooks').$type<string[]>().default([]),
  summary:      text('summary'),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
})

// ── Memory Entries ─────────────────────────────────────────────────────────

export const memoryEntries = pgTable('memory_entries', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId:     uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  type:      text('type').notNull(),
  content:   text('content').notNull(),
  evidence:  jsonb('evidence').$type<string[]>().default([]),
  confidence: integer('confidence').default(80),
  tags:       jsonb('tags').$type<string[]>().default([]),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
})

// ── Ideas ──────────────────────────────────────────────────────────────────

export const ideas = pgTable('ideas', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId:            uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  title:            text('title').notNull(),
  hook:             text('hook'),
  hookType:         text('hook_type'),
  rationale:        text('rationale').notNull(),
  audienceFit:      text('audience_fit'),
  competitorGap:    text('competitor_gap'),
  repetitionRisk:   text('repetition_risk'),
  validationScore:  integer('validation_score'),
  freshnessScore:   integer('freshness_score'),
  topicTags:        jsonb('topic_tags').$type<string[]>().default([]),
  // Multi-platform targeting
  targetPlatforms:  jsonb('target_platforms').$type<string[]>().default(['linkedin']),
  postPurpose:      postPurposeEnum('post_purpose'),
  status:           ideaStatusEnum('status').default('suggested').notNull(),
  rejectionReason:  text('rejection_reason'),
  suggestedAt:      timestamp('suggested_at').defaultNow().notNull(),
  actedAt:          timestamp('acted_at'),
})

// ── Briefings ─────────────────────────────────────────────────────────────

export const briefings = pgTable('briefings', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId:       uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  date:        text('date').notNull(),
  summary:     text('summary').notNull(),
  ideaIds:     jsonb('idea_ids').$type<string[]>().default([]),
  contextUsed: text('context_used'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})

// ── Imports ────────────────────────────────────────────────────────────────

export const imports = pgTable('imports', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId:         uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  platform:      contentPlatformEnum('platform').notNull(),
  entityType:    platformEntityTypeEnum('entity_type').default('personal').notNull(),
  status:        importStatusEnum('status').default('pending').notNull(),
  fileName:      text('file_name'),
  fileUrl:       text('file_url'),
  itemsFound:    integer('items_found').default(0),
  itemsImported: integer('items_imported').default(0),
  error:         text('error'),
  startedAt:     timestamp('started_at').defaultNow().notNull(),
  completedAt:   timestamp('completed_at'),
})

// ── Competitors ────────────────────────────────────────────────────────────

export const competitors = pgTable('competitors', {
  id:       uuid('id').primaryKey().defaultRandom(),
  userId:   uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId:    uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name:     text('name').notNull(),
  platform: contentPlatformEnum('platform').notNull(),
  handle:   text('handle').notNull(),
  notes:    text('notes'),
  addedAt:  timestamp('added_at').defaultNow().notNull(),
})

// ── Knowledge Graph ────────────────────────────────────────────────────────

export const topics = pgTable('topics', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId:      uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name:       text('name').notNull(),
  parentId:   uuid('parent_id'),
  hasGap:     boolean('has_gap').default(false),
  confidence: integer('confidence').default(80),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
}, t => ({ uniq: unique().on(t.userId, t.name) }))

export const hooks = pgTable('hooks', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  text:       text('text').notNull(),
  hookType:   text('hook_type').notNull(),
  confidence: integer('confidence').default(80),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
})

export const audienceSegments = pgTable('audience_segments', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => ({ uniq: unique().on(t.userId, t.name) }))

export const audienceQuestions = pgTable('audience_questions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  question:  text('question').notNull(),
  painPoint: text('pain_point'),
  segments:  jsonb('segments').$type<string[]>().default([]),
  resolved:  boolean('resolved').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Feature: Engagement Feedback Loop ─────────────────────────────────────

export const postPerformance = pgTable('post_performance', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId:           uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  ideaId:          uuid('idea_id').notNull().references(() => ideas.id, { onDelete: 'cascade' }).unique(),
  platform:        contentPlatformEnum('platform').default('linkedin').notNull(),
  publishedAt:     timestamp('published_at').defaultNow().notNull(),
  likes:           integer('likes').default(0),
  comments:        integer('comments').default(0),
  shares:          integer('shares').default(0),
  saves:           integer('saves').default(0),
  impressions:     integer('impressions').default(0),
  engagementScore: integer('engagement_score'),
  hookType:        text('hook_type'),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
})

// Per-user, per-platform hook type batting averages — updated nightly.

export const hookPerformance = pgTable('hook_performance', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform:    contentPlatformEnum('platform').default('linkedin').notNull(),
  hookType:    text('hook_type').notNull(),
  avgScore:    real('avg_score').default(0),
  postCount:   integer('post_count').default(0),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
}, t => ({ uniq: unique().on(t.userId, t.platform, t.hookType) }))

// ── Prompt Vault ───────────────────────────────────────────────────────────
// Reusable prompt templates per platform. Users write once, reuse forever.
// The AI uses these when generating drafts from accepted ideas.

export const promptTemplates = pgTable('prompt_templates', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  userId:              uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId:               uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name:                text('name').notNull(),
  platform:            contentPlatformEnum('platform').notNull(),
  contentType:         contentTypeEnum('content_type').default('post').notNull(),
  // Voice + tone
  toneInstructions:    text('tone_instructions'),      // e.g. "Direct, first-person, no fluff"
  brandVoice:          text('brand_voice'),            // persona line injected into prompt
  formatInstructions:  text('format_instructions'),   // structure / length / style rules
  // Hashtags stored as array
  hashtags:            jsonb('hashtags').$type<string[]>().default([]),
  // Any extra instructions appended to the prompt
  customPrompt:        text('custom_prompt'),
  isDefault:           boolean('is_default').default(false),
  createdAt:           timestamp('created_at').defaultNow().notNull(),
  updatedAt:           timestamp('updated_at').defaultNow().notNull(),
})

// Generated drafts — one per idea per template invocation.

export const generatedDrafts = pgTable('generated_drafts', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  userId:             uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ideaId:             uuid('idea_id').notNull().references(() => ideas.id, { onDelete: 'cascade' }),
  promptTemplateId:   uuid('prompt_template_id').references(() => promptTemplates.id, { onDelete: 'set null' }),
  platform:           contentPlatformEnum('platform').notNull(),
  contentType:        contentTypeEnum('content_type').default('post').notNull(),
  draft:              text('draft').notNull(),
  hashtags:           jsonb('hashtags').$type<string[]>().default([]),
  status:             text('status').default('ready').notNull(), // ready | edited | posted
  createdAt:          timestamp('created_at').defaultNow().notNull(),
  updatedAt:          timestamp('updated_at').defaultNow().notNull(),
})

// ── Feature: Cross-Creator Niche Benchmarking ──────────────────────────────

export const nicheBenchmarks = pgTable('niche_benchmarks', {
  id:           uuid('id').primaryKey().defaultRandom(),
  niche:        text('niche').notNull(),
  topicName:    text('topic_name').notNull(),
  platform:     contentPlatformEnum('platform').default('linkedin').notNull(),
  accountType:  accountTypeEnum('account_type').default('individual').notNull(),
  creatorCount: integer('creator_count').default(0),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
}, t => ({ uniq: unique().on(t.niche, t.topicName, t.platform, t.accountType) }))
