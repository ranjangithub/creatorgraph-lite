import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUserByClerkId } from '@/lib/db/queries/users'
import { updateIdeaStatus } from '@/lib/db/queries/ideas'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getUserByClerkId(clerkId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { id } = await params
  const body = await req.json().catch(() => null)

  if (!body?.status || !['accepted', 'rejected'].includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updated = await updateIdeaStatus(id, user.id, body.status, body.rejectionReason)

  if (!updated) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
  }

  return NextResponse.json(updated)
}
