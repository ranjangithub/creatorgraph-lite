# CreatorGraph Lite — Project Wiki

> This file is the project's living knowledge base.
> Updated on every significant decision. Never overwrite — append.
> Inspired by Karpathy's LLM Wiki pattern (April 2026).

## What we're building
LinkedIn article memory system for professionals.
Ingests a creator's LinkedIn export, builds a knowledge graph of their expertise,
then generates daily evidence-backed content recommendations.

## Core insight
Most content tools answer "how do I write this?"
This answers "should I even write this?" — using the creator's own historical evidence.

## Decisions log

### 2026-05-07 — Stack chosen
Next.js 15 + Clerk + Supabase + Drizzle + Anthropic SDK (TypeScript).
Mobile target: React Native + Expo later — same Supabase backend, same Clerk auth.
Reason: full-stack TypeScript, mobile-ready without rewriting the backend.

### 2026-05-07 — No RAG
Context Engineering approach chosen over RAG.
Creator's memory is pre-compiled into structured markdown blocks.
LLM reads the full context directly — no retrieval, no chunking, no lost structure.
Reason: Karpathy LLM Wiki pattern — "cook once, serve forever" vs RAG's "cook every time."

### 2026-05-07 — Append-only memory
Memory entries are never updated or deleted.
New insight = new row. Historical evidence is preserved forever.
Reason: audit trail, compounding knowledge, Karpathy principle.

### 2026-05-07 — LinkedIn first (tutorial scope)
Full product will support YouTube, TikTok, Instagram, email, WhatsApp.
Tutorial version focuses on LinkedIn only — cleanest scope for teaching Context Engineering.
Full product lives in private repo.

## Open questions
- LinkedIn OAuth via Clerk vs manual CSV export — which is better UX for onboarding?
- Mobile app timeline — when does the React Native version start?
- Pricing model — not defined yet.
