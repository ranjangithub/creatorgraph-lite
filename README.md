# CreatorGraph Lite

Context-engineering-powered content memory for LinkedIn professionals.
Built as a tutorial app to demonstrate the Karpathy LLM Wiki pattern.

## What it does

1. Import your LinkedIn post history (CSV export)
2. Claude extracts structured memories: expertise, voice patterns, audience questions
3. Generate a daily briefing — 3-5 content ideas grounded in your actual history

## Stack

- **Framework:** Next.js 15 App Router
- **Auth:** Clerk
- **Database:** Supabase (Postgres) + Drizzle ORM
- **AI:** Anthropic Claude (claude-3-5-haiku)
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
(no login), populated with a "platform engineering" creator's knowledge graph, 3 sample
posts, and a pre-generated briefing with 2 content ideas ready to accept or reject.

**What is mocked:**
| Service | Mock behaviour |
|---------|----------------|
| Clerk (auth) | Hardcoded user `mock-user-001` — no login screen |
| Postgres (DB) | Local Docker container — fully real queries |
| Anthropic (AI) | Returns fixture responses — no API calls made |

**Switching to real keys:** edit `.env.local`, replace the mock values with your real keys
from Clerk, Supabase, and Anthropic, then restart `npm run dev`.

---

## Local setup checklist

### 1. Clone and install

```bash
git clone https://github.com/ranjangithub/creatorgraph-lite
cd creatorgraph-lite
npm install --legacy-peer-deps
```

### 2. Create `.env.local`

Copy the example file:

```bash
cp .env.local.example .env.local
```

Then fill in each section below.

---

### 3. Clerk (Auth)

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application (choose "Email + Google" for sign-in options)
3. Go to **API Keys** tab
4. Copy into `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

For `CLERK_WEBHOOK_SECRET` — skip for local dev. The webhook syncs Clerk users to
your database; without it, sign-up works but the user row won't be created automatically.
**Workaround:** after signing up, the app will redirect to `/briefing` but show "User not found".
Set up the webhook (step 6 below) to fix this properly.

---

### 4. Supabase (Database)

1. Go to [supabase.com](https://supabase.com) → New project
2. Wait for it to provision (~1 min)
3. Go to **Settings → API**
4. Copy into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

5. Go to **Settings → Database → Connection string**
   - Select **Transaction mode** (port 6543, NOT 5432)
   - Copy the connection string, replace `[YOUR-PASSWORD]` with your project password
   - Add `?sslmode=require` at the end

```
DATABASE_URL=postgresql://postgres.xxxx:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

---

### 5. Anthropic

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. **API Keys** → Create key
3. Copy into `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

---

### 6. Push database schema

Run this once (creates all tables in Supabase):

```bash
npm run db:push
```

If it asks to confirm table creation, type `y`.

---

### 7. Clerk webhook (optional but recommended)

Without this, signing up creates a Clerk account but NOT a row in your `users` table.
The app will break after sign-up. Two options:

**Option A — use ngrok to expose localhost:**

```bash
# Install ngrok if you don't have it
brew install ngrok

# In one terminal, start the app
npm run dev

# In another terminal, expose it
ngrok http 3000
```

Copy the `https://xxxx.ngrok-free.app` URL.

In Clerk dashboard → **Webhooks** → Add endpoint:
- URL: `https://xxxx.ngrok-free.app/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`
- Copy the **Signing Secret** (`whsec_...`) into `.env.local` as `CLERK_WEBHOOK_SECRET`
- Restart `npm run dev`

**Option B — seed your user manually:**

After signing up via Clerk, run this in Supabase SQL editor to insert your user row:

```sql
INSERT INTO users (id, clerk_id, email, name)
VALUES (gen_random_uuid(), 'user_YOUR_CLERK_USER_ID', 'your@email.com', 'Your Name');
```

Get your Clerk user ID from Clerk dashboard → Users.

---

### 8. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Useful commands

```bash
npm run dev          # start dev server
npm run db:push      # sync schema to Supabase (run after schema changes)
npm run db:studio    # visual DB browser (Drizzle Studio)
npm run build        # production build
```

## Project structure

```
app/
  (auth)/            # Clerk sign-in / sign-up pages
  (dashboard)/       # Protected: overview, briefing, import, memory, settings
  api/               # API routes (briefing, import, ideas, clerk webhook)
  page.tsx           # Public landing page
components/
  ui/                # shadcn/ui primitives
  layout/            # Sidebar, Header
  briefing/          # IdeaCard, GenerateBriefingButton
  import/            # LinkedInUploader
lib/
  db/
    schema.ts        # Drizzle schema (source of truth for all tables)
    queries/         # One file per table — all DB access lives here
  anthropic/
    context/loader.ts       # Context Engineering: builds the memory block
    prompts/briefing.ts     # Daily briefing generation
    prompts/memory-extraction.ts  # Extract memories from content batch
  linkedin/parser.ts  # Parse LinkedIn CSV export + plain text files
```

## How LinkedIn import works

1. On LinkedIn: Settings → Data Privacy → Get a copy of your data → Posts → Request archive
2. LinkedIn emails a ZIP within ~10 minutes
3. Open the ZIP, find `Share_Info.csv` or `Posts.csv`
4. Upload it on the Import page
5. Claude reads each post, extracts memories, stores them in `memory_entries`
6. Go to Briefing → Generate — Claude loads your memories and suggests today's ideas

## Context Engineering (the core idea)

Rather than sending all your raw posts to Claude on every request (RAG / retrieval),
this app pre-compiles your content into structured memory entries (Karpathy's LLM Wiki pattern):

```
Raw posts → Claude extracts → memory_entries table
                                     ↓
                         Briefing request loads top 50 memories
                                     ↓
                         Structured context block injected into prompt
                                     ↓
                         Claude generates ideas grounded in YOUR history
```

Context window = RAM. Load exactly the right slice, not everything.
