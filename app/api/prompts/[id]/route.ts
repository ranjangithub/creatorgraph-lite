import { NextResponse } from 'next/server'
import { getOrCreateDbUser } from '@/lib/auth'
import { updatePromptTemplate, deletePromptTemplate } from '@/lib/db/queries/prompts'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const template = await updatePromptTemplate(id, user.id, body)
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ template })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await deletePromptTemplate(id, user.id)
  return NextResponse.json({ ok: true })
}
