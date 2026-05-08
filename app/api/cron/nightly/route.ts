import { NextResponse } from 'next/server'
import {
  cronRefreshHookPerformance,
  cronRefreshNicheBenchmarks,
  cronEnrichIdeas,
} from '@/lib/db/queries/analytics'

// Secured with CRON_SECRET — set in .env.local and your hosting env.
// Vercel Cron calls this with Authorization: Bearer <CRON_SECRET>
// Local dev: call it manually or via `npm run cron:nightly`

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const start = Date.now()
  const results: Record<string, unknown> = {}

  try {
    // ── Job 1: Classify hook types + compute freshness scores ──────────
    // Enriches recent ideas with hookType and freshnessScore so the
    // engagement feedback loop has typed signals to aggregate.
    results.enrichIdeas = await cronEnrichIdeas()
  } catch (e) {
    results.enrichIdeas = { error: String(e) }
  }

  try {
    // ── Job 2: Refresh hook performance batting averages ───────────────
    // Groups all recorded post_performance rows by user+hookType,
    // recalculates average engagement scores, upserts to hook_performance.
    // Feeds the "your hook type X outperforms Y by 40%" insight.
    results.hookPerformance = await cronRefreshHookPerformance()
  } catch (e) {
    results.hookPerformance = { error: String(e) }
  }

  try {
    // ── Job 3: Rebuild niche benchmarks ───────────────────────────────
    // Aggregates topics across all opted-in users grouped by self-declared
    // niche. Powers "8 of 14 creators in your niche cover DevOps but only
    // 2 have written about AI hiring" on the dashboard.
    results.nicheBenchmarks = await cronRefreshNicheBenchmarks()
  } catch (e) {
    results.nicheBenchmarks = { error: String(e) }
  }

  return NextResponse.json({
    ok:       true,
    duration: `${Date.now() - start}ms`,
    jobs:     results,
    ran:      new Date().toISOString(),
  })
}

// Also accept GET so it's easy to trigger from a browser during dev
export const GET = POST
