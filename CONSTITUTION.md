# CreatorGraph Constitution

*The non-negotiable principles behind every product decision.*

---

## 1. Purpose

CreatorGraph exists to give individual creators and brand teams the same content intelligence advantage that well-resourced media companies have always had — a structured memory of what they've said, what their audience cares about, and what's worth saying next.

This is not a content mill. We don't generate content. We surface the right thing for *you* to write, grounded in your actual archive and your audience's actual questions.

---

## 2. Core beliefs

**Your content history is your most underused asset.**
Every post you've published contains signal about what your audience responds to, which topics you own, which hooks you overuse, and what questions keep going unanswered. Most creators treat each post as a fresh start. CreatorGraph treats your archive as structured memory.

**AI should amplify judgment, not replace it.**
We don't generate posts. We generate *briefings* — ranked ideas with evidence. The human writes. The AI does the legwork of finding what's worth writing about. A creator who publishes 20 great posts a year using their own judgment beats one who publishes 200 generic AI posts every time.

**Context engineering beats retrieval.**
We compile content into a typed knowledge graph before any AI query touches it. Topics, hooks, audience questions, and voice patterns are structured nodes — not raw text chunks dumped into a context window. The AI gets the right slice of your memory, not everything at once.

**Transparency builds trust.**
Every idea shows its evidence: which topics it draws on, what the audience signal is, what angle your niche is missing. No black-box suggestions. Creators should understand *why* something is worth writing, not just *that* it is.

**Repetition is the enemy of authority.**
A creator who keeps saying the same thing loses their audience's respect before they lose their follower count. CreatorGraph tracks what you've said. Every idea is tagged: new angle, sequel, or repeat. You know before you write a word.

---

## 3. Product principles

### Build for the serious creator, not the casual one
Our user has 200+ posts in their archive, a defined niche, and a real audience. They don't need inspiration — they need intelligence. Features that only serve someone writing their first post are not priorities.

### Fewer, better ideas
A daily briefing with 5 ranked ideas is better than 50 unranked ones. We cap outputs deliberately. Quality of signal is the product; volume is not.

### Data stays with the creator
Content exports, knowledge graphs, and generated drafts belong to the user. We don't train on user data. We don't aggregate personal content for benchmarking without explicit opt-in. Enterprise customers get dedicated isolation by default.

### Admin controls without redeploys
Runtime parameters — model selection, temperature, noise filters, feature flags — live in the database and are editable from the admin panel. Changing behavior should not require a code push.

### Degrade gracefully, never silently fail
If a news source is unavailable, show cached results with a timestamp. If the AI returns an empty response, show a clear error — not a spinner. If a user's import fails, tell them what went wrong and what to try next. Silent failures erode trust.

### Ship features that remove friction, not add it
Every screen should leave the user closer to publishing something worth reading. Modals, confirmations, and settings that don't directly serve that goal are candidates for removal.

---

## 4. What we will not build

- **A social media scheduler.** There are better tools for that. We get ideas to ready-to-post draft; distribution is the creator's choice.
- **An engagement farm.** Features designed to maximize posting frequency rather than content quality are against our purpose.
- **A content spinner.** Rewriting competitor posts, paraphrasing news articles, or generating posts with no grounding in the creator's voice or archive.
- **Surveillance of other creators.** Competitor gap analysis is powered by opt-in niche benchmarking from our own user base — not scraping, not third-party data brokers.
- **Opaque AI decisions.** Any idea we surface must be explainable: here is the topic, here is the audience signal, here is the angle. If we can't show our work, we don't ship the feature.

---

## 5. Technical principles

**Schema is the source of truth.**
`lib/db/schema.ts` defines all data structures. Changes to product behavior start with a schema change, not an API patch.

**Server components for data, client components for interaction.**
Next.js 15 App Router. Server components fetch and render. Client components handle toggling, typing, and real-time feedback. No client-side data fetching where a server component will do.

**Deduplication at the boundary.**
Hooks, topics, and ideas are deduplicated at insert time and again at query time. We don't accumulate noise in the database and filter later — we stop noise at the door.

**Migrations over destructive schema changes.**
New columns, new tables, new constraints are applied via explicit migration scripts in `scripts/`. No drizzle-kit truncation prompts in production. Data is preserved; schema evolves.

**One model, configurable at runtime.**
The AI model, temperature, and generation parameters are stored in `app_settings` and read at request time. The default is `llama-3.3-70b-versatile` via Groq. Admins can change this without a deploy.

**Security by default.**
Admin routes check `ADMIN_EMAILS` server-side — no hint to the client that the page exists. Stripe webhooks are validated. Clerk JWTs are verified server-side. Stored API keys are AES-256-GCM encrypted.

---

## 6. Team operating principles

**Decisions are made in context, not in the abstract.**
Before changing a feature, read the schema, read the prompt, and read the component that renders it. Abstract discussions without grounding in the code produce bad decisions.

**Write the migration before the component.**
If a feature requires a new table or column, create and run the migration script first. Never build UI against a schema that doesn't exist yet.

**No silent admin-only features.**
Every feature controlled by an admin flag must be documented in the admin panel itself — label, description, and what happens when it's toggled. Operators shouldn't have to read the code to understand what a flag does.

**The CHANGELOG is for users, not contributors.**
What shipped. What changed for the person using the product. Nothing about branch history, plan reviews, or internal version bumps.

---

*This document should be read before any significant feature is designed. Update it when the product's direction genuinely changes — not to win an argument.*
