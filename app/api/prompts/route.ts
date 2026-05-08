import { NextResponse } from 'next/server'
import { getOrCreateDbUser } from '@/lib/auth'
import { ensureDefaultTemplates, createPromptTemplate } from '@/lib/db/queries/prompts'

export async function GET() {
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const templates = await ensureDefaultTemplates(user.id)
  return NextResponse.json({ templates })
}

export async function POST(req: Request) {
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const template = await createPromptTemplate(user.id, body)
  return NextResponse.json({ template })
}
