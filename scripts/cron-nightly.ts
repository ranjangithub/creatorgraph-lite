/**
 * Local dev cron runner — calls /api/cron/nightly on the running dev server.
 * Usage: npm run cron:nightly
 * Production: configure Vercel Cron in vercel.json (already done).
 */
import 'dotenv/config'

const BASE   = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
const SECRET = process.env.CRON_SECRET ?? ''

async function run() {
  console.log(`[cron] Running nightly jobs against ${BASE}...`)

  const res = await fetch(`${BASE}/api/cron/nightly`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${SECRET}`,
    },
  })

  const data = await res.json()
  console.log('[cron] Result:', JSON.stringify(data, null, 2))
}

run().catch(e => { console.error('[cron] Error:', e); process.exit(1) })
