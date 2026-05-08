# CreatorGraph Beta — Pricing Strategy

_Last updated: 2026-05-07_

---

## Cost structure (know this before setting prices)

AI cost per generation (Claude Sonnet 4.6):

| Action | Input tokens | Output tokens | Cost to us |
|--------|-------------|---------------|------------|
| Import batch (30 posts) | ~15K | ~2K | ~$0.075 |
| Briefing generation | ~3K | ~1K | ~$0.024 |
| Draft generation | ~2K | ~0.5K | ~$0.014 |
| 20 free tier generations total | — | — | ~$0.30–0.50/user |

Free tier costs almost nothing per user. A heavy paid user doing 300 generations/month costs ~$4–6 in AI before infrastructure. Margin is healthy at $29+.

---

## The core BYOK principle

BYOK must be a **paid-tier unlock, not a free feature.**

Sophisticated users will pay $5/month in Anthropic API costs and use the product indefinitely if BYOK is free. That kills conversion.

More importantly: the value we sell is not the AI. It's:
- The knowledge graph extraction (nobody else does this)
- The structured memory (Karpathy LLM Wiki pattern — our moat)
- Briefings grounded in the user's actual content history
- Hook performance tracking
- The prompt vault

Position AI as the delivery mechanism. Charge for the intelligence layer.

**BYOK framing to users:** Not "save money" — instead: "Use the models you trust. Bring Claude Opus for premium quality, GPT-4o for your existing OpenAI spend, or Gemini for Google Workspace users. Your key, your bill, zero caps."

---

## Market comparables

| Product | Price | What they charge for |
|---------|-------|---------------------|
| Taplio | $39–99/mo | LinkedIn scheduling + AI posts |
| AuthoredUp | $18–49/mo | LinkedIn formatting + analytics |
| Shield Analytics | $8–25/mo | LinkedIn analytics only |
| Jasper | $39–125/mo | Generic AI writing |
| Hypefury | $19–49/mo | Twitter scheduling + AI |
| Hootsuite | $99–249/mo | Multi-platform scheduling |

We're closer to Taplio than Hootsuite. The knowledge graph extraction is genuinely differentiated — price above Taplio for the right buyer.

---

## Recommended tier structure

### Free — always free
- 20 AI generations/month (app key — no BYOK)
- 1 platform (LinkedIn only)
- Basic briefing (3 ideas/day)
- Knowledge graph (limited: top 20 entries)
- No prompt vault
- Goal: demonstrate value, not sustain usage

### Creator — $29/month
- 150 AI generations/month (app key)
- OR unlimited with own API key (BYOK unlocked)
- 3 platforms
- Full knowledge graph
- Full prompt vault (unlimited templates)
- Hook performance analytics
- Niche benchmarking

### Creator Pro — $59/month
- 500 AI generations/month (app key)
- OR unlimited with BYOK
- All platforms
- Priority processing
- Draft history + export
- Usage analytics dashboard
- Best for daily creators and agency clients

### Enterprise — $249/month (team of 5, $49/seat beyond)
- Everything in Pro
- Multi-member teams (admin / editor / viewer roles)
- Shared org knowledge graph
- Brand voice guidelines (company page support)
- Custom AI model selection (BYOK any provider)
- SSO-ready (Clerk enterprise)
- Dedicated support + SLA

---

## Annual pricing

Push hard for annual. Creator annual = $290/year (2 months free vs monthly).

Mental justification for creators: "less than one freelance article." SaaS health lives in annual ARR. CAC math looks entirely different when customers commit for 12 months.

---

## Rollout sequence

### Ship first (next 30 days)
- Free / Creator / Enterprise tiers
- Stripe integration — monthly + annual (20% discount)
- In-app usage meter visible on every generation
- Hard paywall at free tier limit — show upgrade prompt with remaining features listed
- BYOK gated at Creator tier

### Build toward (60–90 days)
- Annual plans with 2-month discount
- Team seats for Enterprise
- Usage-based overage: 50 extra generations for $5 (vs forced upgrade)
- Referral credit: 5 free generations per referred user who activates

---

## Conversion story (free → paid)

The pitch at the paywall:

> "Your knowledge graph is built. Now let the AI brief you every day and write from it."

Don't sell AI. Sell the graph they already have. Show them what's in it (topics, hooks, audience questions) and gate the daily briefing + draft generation behind Creator.

---

## What to avoid

- **"Unlimited AI"** below $99/month — creates adverse selection, heavy users destroy margin
- **Per-generation pricing** on main plans — creators don't want to feel metered while creating
- **Free BYOK** — kills conversion on your most engaged users
- **Over-gating the knowledge graph on free** — the graph is the product; let people see it build up, gate the actions that use it

---

## Open questions to revisit

- [ ] What's the right seat price for Enterprise beyond 5? ($49 or $39?)
- [ ] Should Creator Pro offer a white-label or export option for agencies?
- [ ] Is $29 too low if comparable tools charge $39? A/B test $29 vs $39 at launch.
- [ ] Overage model vs hard cap — test both; hard cap drives upgrades, overage reduces churn.
