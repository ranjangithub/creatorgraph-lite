import { NextResponse }      from 'next/server'
import { getOrCreateDbUser } from '@/lib/auth'
import { db, audienceSegments } from '@/lib/db'
import { eq, and }           from 'drizzle-orm'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.delete(audienceSegments)
    .where(and(eq(audienceSegments.id, id), eq(audienceSegments.userId, user.id)))

  return NextResponse.json({ ok: true })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name } = await req.json() as { name: string }
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const [row] = await db.update(audienceSegments)
    .set({ name: name.trim() })
    .where(and(eq(audienceSegments.id, id), eq(audienceSegments.userId, user.id)))
    .returning()

  return NextResponse.json(row)
}
