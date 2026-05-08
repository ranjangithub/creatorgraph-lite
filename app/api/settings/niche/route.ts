import { NextResponse } from 'next/server'
import { getOrCreateDbUser } from '@/lib/auth'
import { updateUserNicheSettings } from '@/lib/db/queries/analytics'

export async function POST(req: Request) {
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { niche, shareForBenchmark } = await req.json()
  await updateUserNicheSettings(user.id, niche ?? '', shareForBenchmark ?? false)
  return NextResponse.json({ ok: true })
}
