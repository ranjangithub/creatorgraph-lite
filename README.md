# CreatorGraph Beta

Multi-platform content intelligence for creators and brands.

Import your content history, extract your knowledge graph, generate platform-aware drafts using your own saved voice templates. Stay ahead of what's trending in your niche with daily AI-curated news — and turn any story into a post brief in one click.

Built on the Karpathy LLM Wiki pattern — structured memory, not RAG.

---

## What it does

1. **Import** content from LinkedIn (ZIP or CSV), Medium, Substack, YouTube, GitHub, or local files
2. **Extract** a knowledge graph — topics you own, hooks you use, audience questions, voice patterns, and what your readers care about
3. **Brief** — daily AI-generated content ideas ranked by freshness, audience fit, and hook performance; expand a briefing with planned topics for the week
4. **Draft** — generate ready-to-post content using saved voice templates from your Prompt Vault
5. **Trends** — curated news feed from Hacker News and NewsAPI, filtered to your content niche, refreshed every 4 hours; generate a briefing from any story in one click; 15-day scrollable history
6. **Track** — log post performance per platform; hook batting averages updated nightly

---

## Platform support

| Platform   | Import                          | Content types              | Notes                                            |
|------------|---------------------------------|----------------------------|--------------------------------------------------|
| LinkedIn   | ZIP export, CSV, article URL    | Posts, articles, carousels | Basic export (HTML) and Full export (CSV) both supported |
| YouTube    | URL, transcript paste           | Videos, Shorts             | Transcript extraction                            |
| Instagram  | Caption paste, CSV              | Reels, Carousels, Posts    | API too locked down; manual import               |
| Medium     | Article URL                     | Articles                   | URL scraping                                     |
| Substack   | Post URL                        | Newsletters                | URL scraping                                     |
| GitHub     | Profile URL                     | READMEs, notes             | URL scraping                                     |
| Local file | Upload                          | MD, TXT, CSV               | Any plain text content                           |

---

## Key features

### Knowledge graph
After importing, Claude extracts a typed graph from your content:
- **Topics** — subjects you write about, with authority scores
- **Hooks** — your recurring opening patterns (question, statistic, story, contrarian, list, bold claim) with confidence scores; deduplicated at insert and query time
- **Audience segments** — who reads your content, what they're asking ("What they're asking"), and what's on their mind ("What's on your mind")
- **Content intentions** — recurring themes and angles you return to

### Daily briefing + expand
The briefing generates 5 AI ideas ranked by topic freshness and audience fit. Accept an idea, pick a Prompt Vault template, and get a ready-to-post draft. The **Expand briefing** button adds a week's worth of planned topics — it checks today's already-generated ideas and never duplicates them.

### Trends — What's happening in your world
A separate Trends section surfaces what's actually being talked about in your content world, not tech news in general.

- Pulls from **Hacker News** (Firebase API, no key required) and **NewsAPI** (optional, set `NEWS_API_KEY`)
- Filtered against your knowledge graph topics — only stories relevant to what you write about are shown
- Hard noise filter: consumer hardware (laptops, phones, keyboards), job posts, and product reviews are excluded
- Minimum HN score: 50; maximum 10 results per refresh; sorted by topic match count then score
- **4-hour cache** — auto-refreshes when stale; manual "Refresh now" available
- **Generate briefing** button on each story — opens an inline panel with 3 story-specific post ideas
- **15-day history** — each day's snapshot is preserved; history section shows a collapsible timeline per day

### Admin panel
Developer-only configuration page at `/admin` — no redeploy needed for any setting.

- **Feature flags** — toggle Trends, Expand briefing, Trends history, Chat assistant on/off instantly
- **AI config** — switch model, adjust temperature, set ideas-per-briefing count, tune extraction chunk size
- **Trends config** — set HN minimum score threshold, max results, cache TTL, manage noise keyword list
- **Users** — summary stats (total users, posts imported, briefings run, ideas generated) + searchable table with per-user activity

Access is gated by the `ADMIN_EMAILS` environment variable (comma-separated). Non-admins are silently redirected to `/dashboard`.

---

## Stack

| Layer       | Technology                                  |
|-------------|---------------------------------------------|
| Framework   | Next.js 15 App Router                       |
| Auth        | Clerk                                       |
| Database    | Supabase (Postgres) + Drizzle ORM           |
| AI          | Groq (`llama-3.3-70b-versatile` by default) |
| News (free) | Hacker News Firebase API                    |
| News (opt.) | NewsAPI                                     |
| Payments    | Stripe                                      |
| UI          | Custom dark-mode component system           |

The AI model, temperature, and other generation parameters are all configurable at runtime from the Admin panel without any code changes.

---

## Local dev with mocks (no API keys needed)

Run the full app locally with zero real accounts — Docker provides Postgres, a flag bypasses Clerk, and fixture data replaces AI calls.

**Prerequisites:** Docker Desktop installed and running.

```bash
# 1. Start local Postgres
docker compose up -d

# 2. Use mock environment
cp .env.local.mock .env.local

# 3. Create tables
npm run db:push

# 4. Seed realistic demo data
npm run db:seed-mock

# 5. Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you land directly in the dashboard (no login), populated with a sample creator's knowledge graph and a pre-generated briefing.

| Service         | Mock behaviour                                    |
|-----------------|---------------------------------------------------|
| Clerk (auth)    | Hardcoded user — no login screen                  |
| Postgres (DB)   | Local Docker container — fully real queries       |
| Groq / AI       | Returns fixture responses — no API calls          |
| Trends (HN)     | Uses live HN Firebase API — no key needed         |

---

## Environment variables

### Required for production

```bash
# Auth — Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database — Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres.xxxx:[password]@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require

# AI — Groq
GROQ_API_KEY=gsk_...

# Cron job security
CRON_SECRET=any_random_string

# App URL (used for absolute URL generation)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Payments — Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CREATOR_MONTHLY_PRICE_ID=price_...
STRIPE_CREATOR_ANNUAL_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=price_...
```

### Optional

```bash
# Admin panel — comma-separated list of emails that can access /admin
ADMIN_EMAILS=you@example.com,teammate@example.com

# News — adds NewsAPI articles alongside HN (free tier: 100 req/day)
NEWS_API_KEY=your_newsapi_key

# Anthropic — used for fallback or optional Claude features
ANTHROPIC_API_KEY=sk-ant-...

# Encryption for stored secrets
ENCRYPTION_SECRET=32_char_random_string

# Early-bird campaign
EARLY_BIRD_TOTAL=200
STRIPE_EARLY_BIRD_COUPON_ID=coupon_...
```

---

## Setup guide

### 1. Clone and install

```bash
git clone https://github.com/ranjangithub/creatorgraph-lite
cd creatorgraph-lite
npm install --legacy-peer-deps
```

### 2. Configure environment

```bash
cp .env.local.mock .env.local
# Edit .env.local with your real keys
```

### 3. Clerk (Auth)

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → New application
2. Copy API Keys into `.env.local`
3. Set redirect URLs:

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 4. Supabase (Database)

1. [supabase.com](https://supabase.com) → New project
2. Settings → API → copy URL + keys
3. Settings → Database → Connection string → Transaction mode (port 6543)

### 5. Groq (AI)

1. [console.groq.com](https://console.groq.com) → API Keys
2. Copy `GROQ_API_KEY` into `.env.local`

The model in use is configurable from the Admin panel at runtime. Default: `llama-3.3-70b-versatile`.

### 6. Push schema

```bash
npm run db:push
```

Creates all tables in Supabase. Run again after schema changes. If prompted about unique constraints on existing data, choose "No, add constraint without truncating."

### 7. Seed admin settings (first time only)

```bash
bun run scripts/migrate-admin.ts
```

Seeds default values for feature flags, AI config, and trends config into the `app_settings` table.

### 8. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How LinkedIn import works

LinkedIn offers two export types — both are supported:

**Basic export** (faster, ~1 min):
- Settings → Data Privacy → Get a copy of your data → select basic fields → Request
- Download the ZIP — articles are stored as individual HTML files
- Upload the ZIP directly — the app extracts and parses all articles automatically

**Full export** (slower, up to 24 hours):
- Settings → Data Privacy → Get a copy of your data → select Posts & Articles → Request
- Download the ZIP — contains `Shares.csv` or `Share_Info.csv`
- Upload the ZIP or the CSV directly

Both formats are detected automatically. No manual unzipping required.

---

## Prompt Vault

Settings → Prompt Vault stores reusable voice and format templates per platform.

Each template defines:
- **Platform** and **content type** (LinkedIn post, Instagram carousel, YouTube video, etc.)
- **Brand voice / persona** — who is speaking and from what perspective
- **Tone instructions** — style, register, what to avoid
- **Format instructions** — structure, length, and layout rules
- **Hashtags** — automatically appended to every draft using this template

Four sample templates are pre-loaded on first visit. Edit them to match your voice, add new ones for each platform you post on.

Flow: accept a briefing idea → **Write with AI** → pick platform + template → AI generates a ready-to-post draft using your saved voice. Edit inline, copy to clipboard, paste, and post.

---

## Trends: How news filtering works

The Trends engine runs a two-pass filter to surface only content-worthy stories:

**Pass 1 — Noise exclusion (hard block)**
Stories are excluded if their title matches any of: laptop, macbook, keyboard, mouse, headphone, monitor, GPU, SSD, iPhone, Android, iPad, job posts, product reviews, gaming hardware.

**Pass 2 — Topic match scoring**
Remaining stories are scored by how many of your knowledge graph topics they match. Stories with zero topic matches are excluded unless they independently qualify as content-worthy (AI/ML, startups, productivity, research/reports, creator economy).

**Result:** Maximum 10 stories, sorted by topic match count then HN score. Cached for 4 hours per user.

---

## Nightly batch jobs

A cron job runs at 2am UTC (`/api/cron/nightly`) doing three things:

1. **Idea enrichment** — classifies hook types and computes freshness scores for recent ideas
2. **Hook performance** — aggregates post engagement by hook type per user per platform, updates batting averages
3. **Niche benchmarks** — aggregates topics from opted-in creators by niche and platform, powers first-mover opportunity signals

```bash
npm run cron:nightly   # run locally against dev server
```

Vercel Cron is configured in `vercel.json` for production.

---

## Useful commands

```bash
npm run dev                          # start dev server
npm run db:push                      # sync schema to Supabase
npm run db:studio                    # visual DB browser (Drizzle Studio)
npm run db:seed-mock                 # seed demo data for local dev
npm run cron:nightly                 # run nightly batch jobs
npm run build                        # production build
bun run scripts/migrate-admin.ts     # seed admin settings (first-time setup)
```

---

## Project structure

```
app/
  (auth)/                # Clerk sign-in / sign-up pages
  (dashboard)/
    dashboard/           # Intelligent overview — content DNA, hook leaderboard
    briefing/            # Daily ideas — accept, draft, post, log performance
    import/              # Multi-platform content import
    memory/              # Knowledge graph viewer
    settings/            # Account, Prompt Vault, niche benchmarking
    trends/              # What's happening in your world — news feed + history
  admin/                 # Developer admin panel (guarded by ADMIN_EMAILS)
    layout.tsx           # Auth gate — redirects non-admins to /dashboard
    page.tsx             # Server component — fetches settings + users, renders tabs
  about/                 # About page
  faq/                   # FAQ page
  privacy/               # Privacy policy + disclaimers
  api/
    admin/
      settings/          # GET all settings, PATCH one key (admin-only)
      users/             # GET user list with per-user activity stats (admin-only)
    briefing/            # Generate daily briefing + expand with planned topics
    import/              # Parse and ingest content (CSV, ZIP, URL, HTML batch)
    generate/            # AI draft generation using vault templates
    prompts/             # Prompt Vault CRUD
    ideas/[id]/          # Accept / reject / mark-posted
    trends/              # Fetch + cache trend items per user
    cron/nightly/        # Batch jobs (hook perf, niche benchmarks, idea enrichment)
    audience-segments/   # Audience segment queries
    topics/              # Topic CRUD
  page.tsx               # Public landing page (redirects to /dashboard if logged in)

components/
  admin/
    admin-tabs.tsx        # Client tab switcher
    feature-flags-tab.tsx # Toggle feature flags
    ai-config-tab.tsx     # Model + generation parameter controls
    trends-config-tab.tsx # HN score, results cap, cache TTL, noise keywords
    users-tab.tsx         # User table with stats + search
  trends/
    trends-feed.tsx       # Today's news feed — topic filter pills, refresh, cards
    trends-history.tsx    # 15-day collapsible timeline history
  briefing/              # IdeaCard (with generate panel), GenerateBriefingButton
  import/                # ContentImporter (ZIP/CSV/URL/paste per platform)
  knowledge-graph/       # Dashboard cards — audience segments (with sub-sections)
  settings/              # PromptVault, NicheSettings
  layout/                # Sidebar (with Trends nav), Header
  ui/                    # Shared primitives

lib/
  db/
    schema.ts            # Drizzle schema — all tables including trendItems, appSettings
    queries/
      admin.ts           # FeatureFlags, AIConfig, TrendsConfig — get/set/list
      trends.ts          # getCachedTrends, saveTodayTrends, getTrendHistory
      graph.ts           # topics, hooks (with dedup), audience, intentions
      content.ts         # contentItems CRUD
      briefing.ts        # briefings + ideas
  trends/
    fetcher.ts           # HN + NewsAPI fetch, noise filter, topic scoring
  accounts/
    types.ts             # AccountType, VoiceProfile, AccountStrategy interfaces
    individual.ts        # First-person voice strategy
    enterprise.ts        # Brand voice strategy
    factory.ts           # getAccountStrategy(user) → correct strategy
  platforms/
    types.ts             # Platform, ContentType, PlatformAdapter interfaces
    registry.ts          # getPlatformAdapter(platform) → adapter
    adapters/            # linkedin.ts, youtube.ts, instagram.ts
  briefing/
    generator.ts         # buildBriefingPrompt — wires account + platform + template
  ai/
    client.ts            # Groq client + model config (reads from appSettings)
  auth.ts                # getOrCreateDbUser — lazy user creation on first request

scripts/
  migrate-admin.ts       # Creates app_settings table, seeds defaults
  migrate-trends.ts      # Creates trend_items table
  migrate-trends-v2.ts   # Adds fetch_date column, updates unique constraint
```

---

## Architecture: Context Engineering

Rather than RAG (retrieving raw posts at query time), this app pre-compiles content into a structured knowledge graph:

```
Import content
    ↓
AI extracts → topics, hooks, audience questions, voice patterns, content intentions
    ↓
Stored in graph tables (topics, hooks, audience_segments, audience_questions, content_intentions)
    ↓
Briefing request loads the graph (top 50 entries, right slice for the context window)
    ↓
Structured context block injected into prompt
    ↓
AI generates ideas grounded in YOUR actual history — no duplicates, no hallucinated topics
```

Context window = RAM. Load exactly the right slice, not everything. Each memory is a typed node, not a raw text chunk. The graph tells Claude what topics you own, what your audience asks, which hooks you overuse — not just what you wrote.

### Admin settings as runtime config

The `app_settings` table stores a JSONB document per config key (`feature_flags`, `ai_config`, `trends_config`). Any server component or API route reads from this table at request time, so all parameters are live without a redeploy. The Admin panel writes to this table via `PATCH /api/admin/settings`.
