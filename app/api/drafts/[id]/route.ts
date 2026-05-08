import { NextResponse }        from 'next/server'
import { getOrCreateDbUser }   from '@/lib/auth'
import { getDraft, updateDraftStatus } from '@/lib/db/queries/prompts'

/**
 * GET /api/drafts/:id
 *
 * Retrieve a single draft by ID. Only the owner can access it.
 *
 * Response 200:
 * {
 *   id, ideaId, promptTemplateId,
 *   platform, contentType, status,
 *   draft, hashtags,
 *   createdAt, updatedAt
 * }
 *
 * Response 404: { error: 'Draft not found' }
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const draft = await getDraft(id, user.id)
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

    return NextResponse.json(draft)
  } catch (err) {
    console.error('[GET /api/drafts/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/drafts/:id
 *
 * Update the status of a draft.
 *
 * Body: { "status": "ready" | "edited" | "posted" }
 *
 * Response 200: { success: true }
 * Response 400: { error: 'Invalid status' }
 * Response 404: { error: 'Draft not found' }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body   = await req.json()
    const { status } = body ?? {}

    const VALID = ['ready', 'edited', 'posted']
    if (!status || !VALID.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID.join(', ')}` },
        { status: 400 }
      )
    }

    const existing = await getDraft(id, user.id)
    if (!existing) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

    await updateDraftStatus(id, user.id, status)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/drafts/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
