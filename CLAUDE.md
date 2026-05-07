# CreatorGraph Lite — Agent Instructions

## What this is
LinkedIn content memory system for professionals.
Tutorial version of CreatorGraph AI — focused on a single platform and use case.

## Stack
- Next.js 15 (App Router, TypeScript)
- Clerk (auth — login, register, OAuth)
- Supabase (PostgreSQL + file storage)
- Drizzle ORM (schema in lib/db/schema.ts)
- Anthropic SDK (Claude — lib/anthropic/)
- Tailwind + shadcn/ui

## Key architecture decisions

### Context Engineering pattern
All LLM calls go through `lib/anthropic/context/loader.ts` first.
The loader builds a structured context string from the user's memory, recent content, and competitors.
This string is injected directly into the context window — no RAG, no vector search.
The quality of the context = the quality of the output.

### Append-only memory
`memory_entries` table is append-only. Never update or delete rows.
New insight = new row. Past knowledge is preserved forever.
This is the Karpathy LLM Wiki principle applied to a database.

### Auth flow
Clerk handles all auth. Our `users` table is synced via webhook at `/api/webhooks/clerk`.
Always get the DB user by looking up `clerkId` from `auth()`.

## Commands
```bash
npm install          # install dependencies
npm run dev          # start dev server at localhost:3000
npm run db:push      # push schema to Supabase (dev)
npm run db:generate  # generate migration files
npm run db:migrate   # run migrations
npm run db:studio    # open Drizzle Studio
npm run build        # production build
```

## Env setup
Copy `.env.local.example` to `.env.local` and fill in:
1. Clerk keys from dashboard.clerk.com
2. Supabase keys from supabase.com/dashboard
3. Anthropic API key from console.anthropic.com

## File structure
```
app/
  (auth)/          — Clerk sign-in / sign-up pages
  (dashboard)/     — Protected routes (require auth)
  api/             — API routes
    webhooks/clerk — Clerk user sync
    briefing/      — Daily briefing generation
    memory/        — Memory CRUD
    import/        — LinkedIn data import
lib/
  db/              — Drizzle schema + client
  anthropic/       — LLM client, prompts, context loader
  linkedin/        — CSV parser for LinkedIn exports
components/        — React components (shadcn-based)
hooks/             — Client-side React hooks
types/             — Shared TypeScript types
```

## Skill routing
- Context engineering questions → read lib/anthropic/context/loader.ts
- Database changes → update lib/db/schema.ts, run db:push
- New LLM prompt → add to lib/anthropic/prompts/
- Auth issues → check middleware.ts and app/api/webhooks/clerk/route.ts
