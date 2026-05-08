# CreatorGraph Product Specification

*Living document. Last meaningfully updated: 2025-05. Update when shipped behavior changes — this is not a roadmap, it is a description of what exists.*

---

## Table of contents

1. [User model](#1-user-model)
2. [Account types](#2-account-types)
3. [Subscription tiers](#3-subscription-tiers)
4. [Content import](#4-content-import)
5. [Knowledge graph extraction](#5-knowledge-graph-extraction)
6. [Daily briefing](#6-daily-briefing)
7. [Expand briefing](#7-expand-briefing)
8. [Draft generation — Prompt Vault](#8-draft-generation--prompt-vault)
9. [Trends — What's happening in your world](#9-trends--whats-happening-in-your-world)
10. [Memory viewer](#10-memory-viewer)
11. [Audience segments](#11-audience-segments)
12. [Performance tracking](#12-performance-tracking)
13. [Nightly batch jobs](#13-nightly-batch-jobs)
14. [Admin panel](#14-admin-panel)
15. [Public pages](#15-public-pages)
16. [Data model](#16-data-model)
17. [API surface](#17-api-surface)
18. [Runtime configuration](#18-runtime-configuration)
19. [Environment variables](#19-environment-variables)

---

## 1. User model

Users are created lazily on first authenticated request via `getOrCreateDbUser()` in `lib/auth.ts`. Clerk is the identity layer; the local `users` table stores application state.

**Fields relevant to behavior:**

| Field              | Default       | Meaning                                                    |
|--------------------|---------------|------------------------------------------------------------|
| `accountType`      | `individual`  | `individual` or `enterprise`                               |
| `orgId`            | null          | Set when the user belongs to an enterprise org             |
| `activePlatforms`  | `['linkedin']`| Platforms the user imports and posts on                    |
| `subscriptionTier` | `free`        | `free` / `creator` / `creator_pro` / `enterprise`         |
| `monthlyUsage`     | 0             | AI generation calls this billing period                    |
| `llmProvider`      | `app`         | `app` (shared Groq key) / `anthropic` / `openai` / `google`|
| `llmApiKey`        | null          | AES-256-GCM encrypted BYOK key                             |
| `niche`            | null          | Used for niche benchmarking                                |
| `shareForBenchmark`| false         | Opt-in for cross-creator topic aggregation                 |

---

## 2. Account types

### Individual
Default. Single user, first-person voice. All knowledge graph data scoped to `userId`. No org membership required.

### Enterprise
Org-scoped. Multiple members with roles (`admin`, `editor`, `viewer`). Brand voice guidelines stored on the `organizations` table (`brandVoice`, `contentPillars`). Members share an org knowledge graph. Admins manage team membership and billing.

---

## 3. Subscription tiers

| Tier          | Monthly imports | Briefings/mo | Ideas/briefing | Draft generation | Trends  |
|---------------|-----------------|--------------|----------------|------------------|---------|
| Free          | 1               | 5            | 3              | 3/mo             | Read-only|
| Creator       | Unlimited       | 30           | 5              | Unlimited        | Full    |
| Creator Pro   | Unlimited       | Unlimited    | 5              | Unlimited        | Full    |
| Enterprise    | Unlimited       | Unlimited    | 5              | Unlimited        | Full    |

Billing is handled by Stripe. Webhook at `/api/webhooks/stripe` updates `subscriptionStatus`, `subscriptionTier`, `stripePriceId`, and `currentPeriodEnd` on every relevant event.

---

## 4. Content import

**Entry point:** `/import` (dashboard route) → `components/import/ContentImporter`

**API:** `POST /api/import` — accepts multipart form data or JSON body depending on source type.

### Supported sources

| Source     | Input method          | Parser                        | Notes                                          |
|------------|-----------------------|-------------------------------|------------------------------------------------|
| LinkedIn   | ZIP upload or CSV     | `lib/linkedin/parser.ts`      | Auto-detects basic (HTML) vs full (CSV) export |
| YouTube    | URL or transcript paste | URL fetch + transcript strip | Extracts title + body from video page          |
| Medium     | Article URL           | URL fetch + article scrape    |                                                |
| Substack   | Post URL              | URL fetch + post scrape       |                                                |
| GitHub     | Profile URL           | URL fetch + README scrape     |                                                |
| Local file | File upload           | Plain text / markdown parser  | `.md`, `.txt`, `.csv` accepted                 |

### Import lifecycle

1. File received → `imports` row created with `status: 'pending'`
2. Content parsed into raw text chunks
3. Chunks upserted into `content_items` (unique on `userId + externalId`)
4. Extraction triggered: AI reads chunks in batches (`chunkSize` from admin config, default 20) and extracts graph nodes
5. `imports` row updated to `status: 'completed'` or `status: 'failed'` with error message

### LinkedIn export formats

**Basic export (HTML):**
- Settings → Data Privacy → Get a copy of your data → basic fields → Request
- ZIP contains individual `.html` files per article
- App unzips and parses all HTML files automatically

**Full export (CSV):**
- Same path, select Posts & Articles
- ZIP contains `Shares.csv` or `Share_Info.csv`
- Both filenames are recognized; CSV rows parsed per post

---

## 5. Knowledge graph extraction

After import, AI reads content in batches and populates five graph tables:

| Table               | What it stores                                         | Dedup key                     |
|---------------------|--------------------------------------------------------|-------------------------------|
| `topics`            | Subject areas the creator covers + authority score     | `userId + name` (normalized)  |
| `hooks`             | Opening patterns (question, stat, story, bold claim…) | `userId + text` (120-char prefix, lowercased) |
| `audience_segments` | Reader personas (job titles, interests, pain points)  | `userId + name`               |
| `audience_questions`| Questions the audience keeps asking                   | `userId + question` (normalized) |
| `content_intentions`| Topics the creator plans to cover                     | `userId + topic`              |

**Deduplication:**
- `insertHooks` in `lib/db/queries/graph.ts` pre-fetches existing hook texts before insert; skips any that match the first 120 chars (lowercased). `getHooks` additionally deduplicates in memory so that any dupes that existed before the fix are not surfaced.
- Topics and segments use `onConflictDoUpdate` for upsert semantics.

**Chunk size** is configurable from the admin panel (default: 20 posts per AI call). Reduce if hitting Groq token limits.

---

## 6. Daily briefing

**Entry point:** `/briefing` (dashboard route)

**API:** `POST /api/briefing`

### What the briefing generates

5 content ideas (configurable from admin, default 5) ranked by:
1. Topic freshness (days since last post on that topic)
2. Audience question backlog (open questions that map to the topic)
3. Hook diversity (avoids the creator's most overused hook types)

Each idea includes:
- **Title** — specific, postable headline
- **Hook type** — question / statistic / story / contrarian / list / bold claim
- **Rationale** — why this, why now
- **Audience fit** — which segment benefits most
- **Angle** — what competing creators are not saying

### Idea lifecycle

```
suggested → accepted → [draft generated] → posted
         → rejected
         → archived
```

Status is updated via `PATCH /api/ideas/[id]`.

### Duplicate prevention

Before the AI generates ideas, today's existing ideas for the user are fetched and their titles injected into the prompt with the instruction "do NOT duplicate or closely paraphrase these." This prevents re-running a briefing from producing the same ideas.

---

## 7. Expand briefing

**API:** `POST /api/briefing/expand`

Generates a week's worth of planned topics (7 ideas) beyond the current briefing. Uses the same knowledge graph context. Fetches today's already-generated ideas before the AI call and excludes them from the output.

Toggle visibility via the `expand_briefing` feature flag in the admin panel.

---

## 8. Draft generation — Prompt Vault

**API:** `POST /api/generate`

### Prompt Vault

Stored in `prompt_templates`. Each template defines:
- Platform + content type
- Brand voice / persona line
- Tone instructions
- Format instructions (structure, length, layout)
- Hashtags (auto-appended)
- Custom prompt (arbitrary additional instructions)

Four sample templates are created on first visit to `/settings`.

### Draft generation flow

1. User accepts a briefing idea
2. Picks a Prompt Vault template from the briefing card
3. `POST /api/generate` receives `ideaId` + `promptTemplateId`
4. Server loads the idea, the template, and the user's graph context
5. AI generates a platform-aware draft in the creator's voice
6. Draft saved to `generated_drafts`; returned inline in the briefing card

---

## 9. Trends — What's happening in your world

**Route:** `/trends` (dashboard sidebar → Trends)

**API:** `GET /api/trends`, `POST /api/trends/refresh`

**Feature flag:** `trends` in admin panel

### Data sources

| Source       | Key required | Notes                                        |
|--------------|--------------|----------------------------------------------|
| Hacker News  | None         | Firebase API — free, no rate limit for reads |
| NewsAPI      | `NEWS_API_KEY` (optional) | 100 req/day free tier          |

### Noise filtering (two-pass)

**Pass 1 — hard block (NOISE_PATTERNS)**
Stories are excluded if their title matches any pattern in the noise list. Current patterns: laptop, macbook, thinkpad, starfighter, keyboard, mouse, headphone, monitor, iPhone, Android, iPad, GPU, SSD, gaming, job listing, "is hiring", review, unboxing.

**Pass 2 — topic scoring (CONTENT_WORTHY_PATTERNS)**
Remaining stories are scored by how many of the user's knowledge graph topics appear in the title or description. Stories with zero topic matches are shown only if they match a content-worthy pattern (AI/ML, startups, productivity, research/study/report/survey, creator economy, social media, content marketing).

**Result:** Maximum 10 stories (configurable via admin), sorted by topic match count descending, then HN score descending.

### Caching and refresh

- Cache TTL: 4 hours by default (configurable via admin `cacheTtlHours`)
- `getCachedTrends` checks `fetchDate = today AND fetchedAt > (now - TTL)`
- If stale or missing, the page server component fetches fresh and saves to DB
- Users can force-refresh via the "Refresh now" button (calls `POST /api/trends/refresh`)

### 15-day history

Each day's fetch is stored as a separate snapshot using `fetchDate: YYYY-MM-DD`. The unique constraint is `(userId, externalId, fetchDate)` — one row per story per day per user.

On each save, rows older than 15 days are automatically deleted (`fetchDate < today - 15`).

`getTrendHistory` returns the past 14 days (excluding today), grouped by date, newest first. Rendered as a collapsible timeline in `components/trends/trends-history.tsx`.

**Feature flag:** `trends_history` controls visibility of the history section.

### Generate briefing from a trend

Each trend card has a "Generate briefing" button that opens an inline `IdeaPanel`. The panel calls `POST /api/briefing` with the story title and description as additional context, returning 3 story-specific post ideas.

---

## 10. Memory viewer

**Route:** `/memory`

Displays the user's compiled knowledge graph across five sections:
- **Topics** — with authority scores and post counts
- **Hooks** — with confidence scores and type classification
- **Audience segments** — with sub-sections for questions and intentions
- **Content intentions** — topics the creator wants to cover next
- **Raw memories** — unstructured notes stored via `memory_entries`

---

## 11. Audience segments

**Component:** `components/knowledge-graph/audience-segments-card.tsx`

Each audience segment card shows three sub-sections:

| Sub-section         | Data source           | Icon                   |
|---------------------|-----------------------|------------------------|
| Who they are        | `audienceSegments`    | Users icon             |
| What they're asking | `audienceQuestions`   | MessageCircle (blue)   |
| What's on your mind | `contentIntentions`   | Lightbulb (purple)     |

Top 3 items per sub-section are shown. Questions and intentions are fetched in parallel with segments at page load.

---

## 12. Performance tracking

**API:** `PATCH /api/ideas/[id]` with `{ status: 'posted', performanceScore, engagementNotes }`

Performance data is stored in `post_performance` (one row per post per platform). The nightly job aggregates these into `hook_performance` (batting averages by hook type per platform).

Hook performance is surfaced in the briefing as a signal: if a creator's "question" hooks have a high batting average, question-led ideas score higher.

---

## 13. Nightly batch jobs

**Endpoint:** `POST /api/cron/nightly` (secured by `CRON_SECRET` header)

**Schedule:** 2am UTC via Vercel Cron (`vercel.json`)

### Job 1 — Idea enrichment
For ideas created in the past 7 days with no hook type classification:
- Classifies hook type (question / statistic / story / contrarian / list / bold claim)
- Computes freshness score (days since last topic coverage)
- Updates `ideas.hookType` and `ideas.freshnessScore`

### Job 2 — Hook performance aggregation
For users with `post_performance` rows from the past 30 days:
- Groups by `hookType + platform`
- Computes `avgScore` and `postCount`
- Upserts into `hook_performance`

### Job 3 — Niche benchmark aggregation
For users with `shareForBenchmark: true` and a non-null `niche`:
- Aggregates their top topics into `niche_benchmarks`
- Powers the "first-mover opportunity" signal in briefings (topics covered by few creators in the niche)

---

## 14. Admin panel

**Route:** `/admin` — only accessible to emails listed in `ADMIN_EMAILS` env var. Non-admins are redirected to `/dashboard` with no indication the page exists.

**API:**
- `GET /api/admin/settings` — returns all three config documents
- `PATCH /api/admin/settings` — updates one key (`feature_flags` / `ai_config` / `trends_config`)
- `GET /api/admin/users` — returns all users with per-user activity stats

### Tab: Feature flags

| Flag              | Controls                                                |
|-------------------|---------------------------------------------------------|
| `trends`          | Shows/hides Trends in sidebar and enables `/trends` page|
| `expand_briefing` | Shows/hides the Expand briefing button                  |
| `trends_history`  | Shows/hides the 15-day history section on Trends page   |
| `chat`            | Shows/hides the floating chat assistant                 |

### Tab: AI config

| Parameter     | Default                    | Effect                                               |
|---------------|----------------------------|------------------------------------------------------|
| `model`       | `llama-3.3-70b-versatile`  | Groq model for all AI calls                          |
| `temperature` | `0.7`                      | Generation creativity (0 = deterministic, 1 = creative)|
| `ideaCount`   | `5`                        | Ideas generated per briefing                         |
| `chunkSize`   | `20`                       | Posts per AI extraction batch                        |

### Tab: Trends config

| Parameter       | Default | Effect                                                 |
|-----------------|---------|--------------------------------------------------------|
| `hnMinScore`    | `50`    | Hacker News minimum score threshold                    |
| `maxResults`    | `10`    | Maximum trend items shown                              |
| `cacheTtlHours` | `4`     | Hours before a cached fetch is considered stale        |
| `noiseKeywords` | `[]`    | Additional words to add to the noise filter            |

### Tab: Users

Summary stats: total users, posts imported, briefings run, ideas generated. Searchable table with per-user counts and subscription tier. Sorted by join date descending.

---

## 15. Public pages

| Route      | Purpose                                                                      |
|------------|------------------------------------------------------------------------------|
| `/`        | Landing page — pain points, 9-feature grid, how it works, pricing, mini FAQ  |
| `/about`   | Mission, product values, tech stack, team                                    |
| `/faq`     | 30+ questions across 6 categories (getting started, features, import, AI, data & privacy, billing); category jump links at top |
| `/privacy` | Privacy policy, third-party services, disclaimers, liability                 |
| `/pricing` | Plan comparison + Stripe checkout links                                      |
| `/sign-in` | Clerk-hosted sign-in                                                         |
| `/sign-up` | Clerk-hosted sign-up                                                         |

### Landing page features grid

The `/` page features section shows 9 live features:

| Feature                             | Icon        |
|-------------------------------------|-------------|
| Entire content history as context   | Brain       |
| Repetition guard                    | Repeat      |
| Audience questions surfaced         | MessageCircle|
| Trending news filtered to niche     | Globe       |
| Daily briefing + expand to week     | Zap         |
| Prompt Vault — drafts in your voice | BookOpen    |
| Hook performance analytics          | BarChart2   |
| Audience segments with open questions| Users      |
| Multi-platform import               | Layers      |

### FAQ categories

| Category              | Questions |
|-----------------------|-----------|
| Getting started       | 5         |
| Features & capabilities| 8        |
| Import & content      | 4         |
| AI & technology       | 4         |
| Data & privacy        | 4         |
| Plans & billing       | 4         |

---

## 16. Data model

### Tables

| Table                | Purpose                                                  |
|----------------------|----------------------------------------------------------|
| `users`              | Application user — linked to Clerk by `clerkId`          |
| `organizations`      | Enterprise org — brand voice, content pillars            |
| `org_members`        | User ↔ org with role                                     |
| `platform_connections`| Which handle/channel per platform per user              |
| `content_items`      | Every imported post/article/video                        |
| `memory_entries`     | Unstructured notes added via the Memory viewer           |
| `imports`            | Import job history and status                            |
| `topics`             | Graph node — topic with authority score                  |
| `hooks`              | Graph node — hook pattern with confidence and type       |
| `audience_segments`  | Graph node — reader persona                              |
| `audience_questions` | Graph node — question the audience keeps asking          |
| `content_intentions` | Graph node — topic the creator intends to cover          |
| `briefings`          | One row per briefing generation                          |
| `ideas`              | One row per idea; status lifecycle                       |
| `prompt_templates`   | Prompt Vault entries per platform                        |
| `generated_drafts`   | AI-generated draft per idea per template                 |
| `post_performance`   | Per-post engagement score and notes                      |
| `hook_performance`   | Aggregated batting average per hook type per platform    |
| `competitors`        | Tracked competitor profiles (future feature)             |
| `niche_benchmarks`   | Aggregated topic data for cross-creator comparison       |
| `trend_items`        | Cached news stories per user per day (15-day retention)  |
| `app_settings`       | Runtime config — JSONB per key                           |

### Enums

- `account_type`: `individual`, `enterprise`
- `org_role`: `admin`, `editor`, `viewer`
- `content_platform`: `linkedin`, `youtube`, `tiktok`, `instagram`, `medium`, `substack`, `email`, `document`, `other`
- `platform_entity_type`: `personal`, `company_page`, `brand_channel`
- `content_type`: `post`, `video`, `reel`, `carousel`, `article`, `short`, `story`, `newsletter`
- `post_purpose`: `thought_leadership`, `product`, `culture`, `education`, `personal_story`, `announcement`, `engagement`, `hiring`
- `idea_status`: `suggested`, `accepted`, `rejected`, `published`, `archived`
- `import_status`: `pending`, `processing`, `completed`, `failed`

---

## 17. API surface

### Briefing
| Method | Endpoint                  | Auth  | Description                                  |
|--------|---------------------------|-------|----------------------------------------------|
| POST   | `/api/briefing`           | User  | Generate daily briefing                      |
| POST   | `/api/briefing/expand`    | User  | Expand with a week of planned topics         |

### Ideas
| Method | Endpoint                  | Auth  | Description                                  |
|--------|---------------------------|-------|----------------------------------------------|
| PATCH  | `/api/ideas/[id]`         | User  | Update idea status / log performance         |
| GET    | `/api/ideas`              | User  | List ideas for the current user              |

### Import
| Method | Endpoint                  | Auth  | Description                                  |
|--------|---------------------------|-------|----------------------------------------------|
| POST   | `/api/import`             | User  | Upload and process content                   |

### Draft generation
| Method | Endpoint                  | Auth  | Description                                  |
|--------|---------------------------|-------|----------------------------------------------|
| POST   | `/api/generate`           | User  | Generate a draft from an idea + template     |

### Prompt Vault
| Method | Endpoint                  | Auth  | Description                                  |
|--------|---------------------------|-------|----------------------------------------------|
| GET    | `/api/prompts`            | User  | List all templates for current user          |
| POST   | `/api/prompts`            | User  | Create a template                            |
| PATCH  | `/api/prompts/[id]`       | User  | Update a template                            |
| DELETE | `/api/prompts/[id]`       | User  | Delete a template                            |

### Trends
| Method | Endpoint                  | Auth  | Description                                  |
|--------|---------------------------|-------|----------------------------------------------|
| GET    | `/api/trends`             | User  | Fetch (or return cached) today's trends      |
| POST   | `/api/trends/refresh`     | User  | Force-refresh the trends cache               |

### Knowledge graph
| Method | Endpoint                       | Auth  | Description                             |
|--------|--------------------------------|-------|-----------------------------------------|
| GET    | `/api/topics`                  | User  | List topics                             |
| GET    | `/api/audience-segments`       | User  | List segments with questions + intentions|
| GET    | `/api/intentions`              | User  | List content intentions                 |
| POST   | `/api/intentions`              | User  | Add a content intention                 |
| GET    | `/api/memory`                  | User  | List memory entries                     |

### Admin
| Method | Endpoint                     | Admin | Description                               |
|--------|------------------------------|-------|-------------------------------------------|
| GET    | `/api/admin/settings`        | Yes   | All config keys and their values          |
| PATCH  | `/api/admin/settings`        | Yes   | Update one config key                     |
| GET    | `/api/admin/users`           | Yes   | All users with per-user activity stats    |

### Billing
| Method | Endpoint                     | Auth  | Description                               |
|--------|------------------------------|-------|-------------------------------------------|
| POST   | `/api/stripe/checkout`       | User  | Create Stripe checkout session            |
| POST   | `/api/stripe/portal`         | User  | Create Stripe billing portal session      |
| POST   | `/api/webhooks/stripe`       | Stripe| Handle subscription lifecycle events      |

### Cron
| Method | Endpoint                     | Secret| Description                               |
|--------|------------------------------|-------|-------------------------------------------|
| POST   | `/api/cron/nightly`          | Yes   | Run nightly batch jobs                    |

---

## 18. Runtime configuration

All runtime parameters live in the `app_settings` table as JSONB. Three keys:

### `feature_flags`
```json
{
  "trends": true,
  "expand_briefing": true,
  "trends_history": true,
  "chat": true
}
```

### `ai_config`
```json
{
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.7,
  "ideaCount": 5,
  "chunkSize": 20
}
```

### `trends_config`
```json
{
  "hnMinScore": 50,
  "maxResults": 10,
  "cacheTtlHours": 4,
  "noiseKeywords": []
}
```

These defaults are seeded by running `bun run scripts/migrate-admin.ts`. Subsequent changes are made through the Admin panel and take effect on the next request.

---

## 19. Environment variables

### Required
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
GROQ_API_KEY
CRON_SECRET
NEXT_PUBLIC_APP_URL
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_CREATOR_MONTHLY_PRICE_ID
STRIPE_CREATOR_ANNUAL_PRICE_ID
STRIPE_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_ANNUAL_PRICE_ID
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID
```

### Optional
```
ADMIN_EMAILS            # Comma-separated list of emails that can access /admin
NEWS_API_KEY            # Adds NewsAPI articles to the Trends feed (100 req/day free)
ANTHROPIC_API_KEY       # For optional Claude features or BYOK users on Anthropic
ENCRYPTION_SECRET       # AES-256-GCM key for encrypting stored BYOK API keys
EARLY_BIRD_TOTAL        # Early-bird campaign seat count
STRIPE_EARLY_BIRD_COUPON_ID
MOCK_AUTH               # Set to 'true' for local dev without Clerk
```

### Clerk redirect URLs (set in Clerk dashboard and .env.local)
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```
