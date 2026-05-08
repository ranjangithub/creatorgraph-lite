import { NextResponse }      from 'next/server'
import { getOrCreateDbUser } from '@/lib/auth'
import { db, audienceSegments } from '@/lib/db'
import { eq }                from 'drizzle-orm'

export async function GET() {
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(audienceSegments).where(eq(audienceSegments.userId, user.id))
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json() as { name: string }
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const [row] = await db.insert(audienceSegments)
    .values({ userId: user.id, name: name.trim() })
    .onConflictDoUpdate({
      target: [audienceSegments.userId, audienceSegments.name],
      set:    { name: name.trim() },
    })
    .returning()

  return NextResponse.json(row)
}
