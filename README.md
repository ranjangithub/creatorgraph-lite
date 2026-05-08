# CreatorGraph Beta

Multi-platform content intelligence for creators and brands.
Import your content history, extract your knowledge graph, generate platform-aware drafts using your own saved voice templates.

Built on the Karpathy LLM Wiki pattern — structured memory, not RAG.

---

## What it does

1. **Import** content from LinkedIn (ZIP or CSV), Medium, Substack, YouTube, GitHub, or local files
2. **Extract** a knowledge graph — topics you own, hooks you use, audience questions, voice patterns
3. **Brief** — daily AI-generated content ideas ranked by freshness, audience fit, and hook performance
4. **Draft** — generate ready-to-post content using saved voice templates from your Prompt Vault
5. **Track** — log post performance per platform; hook batting averages updated nightly

---

## Platform support

| Platform | Import | Content types | Notes |
|----------|--------|---------------|-------|
| LinkedIn | ZIP export, CSV, article URL | Posts, articles, carousels | Basic export (HTML) and Full export (CSV) both supported |
| YouTube | URL, transcript paste | Videos, Shorts | Transcript extraction |
| Instagram | Caption paste, CSV | Reels, Carousels, Posts | API too locked down; manual import |
| Medium | Article URL | Articles | URL scraping |
| Substack | Post URL | Newsletters | URL scraping |
| GitHub | Profile URL | READMEs, notes | URL scraping |
| Local file | Upload | MD, TXT, CSV | Any plain text content |

---

## Account types

**Individual creator** — personal brand, first-person voice, LinkedIn/YouTube/Instagram profiles.

**Enterprise** — company brand, team members (admin/editor/viewer), brand voice guidelines, content pillars, company pages and brand channels.

---

## Stack

- **Framework:** Next.js 15 App Router
- **Auth:** Clerk
- **Database:** Supabase (Postgres) + Drizzle ORM
- **AI:** Anthropic Claude (`claude-sonnet-4-6`)
- **UI:** Tailwind + shadcn/ui

---

## Local dev with mocks (no API keys needed)

Run the full app locally with zero real accounts — Docker provides Postgres,
a flag bypasses Clerk, and fixture data replaces Anthropic API calls.

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

Open [http://localhost:3000](http://localhost:3000) — you land directly in the dashboard
(no login), populated with a sample creator's knowledge graph and a pre-generated briefing.

**What is mocked:**

| Service | Mock behaviour |
|---------|----------------|
| Clerk (auth) | Hardcoded user — no login screen |
| Postgres (DB) | Local Docker container — fully real queries |
| Anthropic (AI) | Returns fixture responses — no API calls made |

---

## Switching from mock to real services

### Step 1 — update `.env.local`

```bash
MOCK_AUTH=false
ANTHROPIC_API_KEY=sk-ant-YOUR_REAL_KEY
```

### Step 2 — add real service keys

**Clerk** — from [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Supabase** — from your project → Settings → API and Settings → Database:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres.xxxx:[password]@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
```

**Cron secret** — any random string, used to secure the nightly job endpoint:
```
CRON_SECRET=your_secret_here
```

### Step 3 — push schema and start

```bash
npm run db:push
npm run dev
```

Users are created lazily on first authenticated request — no webhook required. Sign up via Clerk, the app creates your DB row automatically on first page load.

---

## Local setup checklist

### 1. Clone and install

```bash
git clone https://github.com/ranjangithub/creatorgraph-lite
cd creatorgraph-lite
npm install --legacy-peer-deps
```

### 2. Create `.env.local`

```bash
cp .env.local.mock .env.local
```

Edit the file — see sections below for each service.

---

### 3. Clerk (Auth)

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application
3. Go to **API Keys** and copy:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Set the redirect URLs:
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

---

### 4. Supabase (Database)

1. Go to [supabase.com](https://supabase.com) → New project
2. Go to **Settings → API** and copy:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

3. Go to **Settings → Database → Connection string** → Transaction mode (port 6543):

```
DATABASE_URL=postgresql://postgres.xxxx:[password]@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
```

---

### 5. Anthropic

1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys
2. Copy into `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

---

### 6. Push database schema

```bash
npm run db:push
```

Creates all tables in Supabase. Run again after any schema changes.

---

### 7. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

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

Both formats are detected automatically. You do not need to unzip manually.

---

## Prompt Vault

Settings → Prompt Vault stores reusable voice + format templates per platform.

Each template defines:
- **Platform** and **content type** (LinkedIn post, Instagram carousel, YouTube video, etc.)
- **Brand voice / persona** — who is speaking and from what perspective
- **Tone instructions** — style, register, what to avoid
- **Format instructions** — structure, length, and layout rules
- **Hashtags** — automatically appended to every draft using this template

Four sample templates are pre-loaded on first visit. Edit them to match your voice, add new ones for each platform you post on.

When you accept a briefing idea → **Write with AI** → pick platform + template → AI generates a ready-to-post draft using your saved voice. Edit inline, copy to clipboard, open the platform, paste, and post.

---

## Nightly batch jobs

A cron job runs at 2am UTC (`/api/cron/nightly`) doing three things:

1. **Idea enrichment** — classifies hook types (question, statistic, story, contrarian, list, bold claim) and computes freshness scores for recent ideas
2. **Hook performance** — aggregates post engagement by hook type per user per platform, updates batting averages
3. **Niche benchmarks** — aggregates topics from opted-in creators by niche and platform, powers the "first-mover opportunity" signals

Run locally with:
```bash
npm run cron:nightly
```

Vercel Cron is configured in `vercel.json` for production.

---

## Useful commands

```bash
npm run dev           # start dev server
npm run db:push       # sync schema changes to Supabase
npm run db:studio     # visual DB browser (Drizzle Studio)
npm run db:seed-mock  # seed demo data for local dev
npm run cron:nightly  # run nightly batch jobs against local dev server
npm run build         # production build
```

---

## Project structure

```
app/
  (auth)/              # Clerk sign-in / sign-up pages
  (dashboard)/
    dashboard/         # Intelligent overview — content DNA, hook leaderboard
    briefing/          # Daily ideas — accept, draft, post, log performance
    import/            # Multi-platform content import
    memory/            # Knowledge graph viewer
    settings/          # Account, Prompt Vault, niche benchmarking, hook stats
  api/
    briefing/          # Generate daily briefing
    import/            # Parse and ingest content (CSV, ZIP, URL, HTML batch)
    generate/          # AI draft generation using vault templates
    prompts/           # Prompt Vault CRUD
    ideas/[id]/        # Accept / reject / mark-posted
    cron/nightly/      # Batch jobs (hook perf, niche benchmarks, idea enrichment)
    settings/niche/    # Niche + benchmark opt-in settings
  page.tsx             # Public landing page (redirects to /dashboard if logged in)

components/
  ui/                  # shadcn/ui primitives
  layout/              # Sidebar, Header
  briefing/            # IdeaCard (with generate panel), GenerateBriefingButton
  import/              # ContentImporter (ZIP/CSV/URL/paste per platform)
  settings/            # PromptVault, NicheSettings
  onboarding/          # Wizard, MockSignin

lib/
  db/
    schema.ts          # Drizzle schema — source of truth for all tables
    queries/           # One file per domain (analytics, content, ideas, prompts, …)
  accounts/
    types.ts           # AccountType, VoiceProfile, AccountStrategy interfaces
    individual.ts      # First-person voice strategy
    enterprise.ts      # Brand voice strategy
    factory.ts         # getAccountStrategy(user) → correct strategy
  platforms/
    types.ts           # Platform, ContentType, PlatformAdapter interfaces
    registry.ts        # getPlatformAdapter(platform) → adapter
    adapters/          # linkedin.ts, youtube.ts, instagram.ts
  briefing/
    generator.ts       # buildBriefingPrompt — wires account + platform + template
  anthropic/
    client.ts          # Shared Anthropic client + model config
    prompts/           # briefing.ts, graph-extraction.ts
  linkedin/
    parser.ts          # Parse LinkedIn CSV export + plain text docs
  auth.ts              # getOrCreateDbUser — lazy user creation on first request
```

---

## Architecture: Context Engineering

Rather than RAG (retrieving raw posts at query time), this app pre-compiles content into a structured knowledge graph:

```
Import content
    ↓
Claude extracts → topics, hooks, audience questions, voice patterns
    ↓
Stored in graph tables (topics, hooks, audience_segments, audience_questions)
    ↓
Briefing request loads the graph (top 50 entries, right slice for the context window)
    ↓
Structured context block injected into prompt
    ↓
Claude generates ideas grounded in YOUR actual history
```

Context window = RAM. Load exactly the right slice, not everything.
Each memory is a typed node, not a raw text chunk. The graph tells Claude
what topics you own, what your audience asks, which hooks you overuse — not just what you wrote.
