import { NextResponse }      from 'next/server'
import { getOrCreateDbUser } from '@/lib/auth'
import { listDrafts }        from '@/lib/db/queries/prompts'

/**
 * GET /api/drafts
 *
 * Returns the authenticated user's generated drafts.
 *
 * Query params (all optional):
 *   platform  – filter by platform: linkedin | youtube | instagram | medium | substack | email | other
 *   status    – filter by status:   ready | edited | posted
 *   ideaId    – filter by source idea UUID
 *   limit     – page size (default 20, max 100)
 *   offset    – pagination offset (default 0)
 *
 * Response 200:
 * {
 *   drafts: [
 *     {
 *       id, ideaId, promptTemplateId,
 *       platform, contentType, status,
 *       draft, hashtags,
 *       createdAt, updatedAt
 *     }
 *   ],
 *   total: number   // count in this page (use with offset to paginate)
 * }
 */
export async function GET(req: Request) {
  try {
    const user = await getOrCreateDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)

    const rawLimit  = parseInt(searchParams.get('limit')  ?? '20', 10)
    const rawOffset = parseInt(searchParams.get('offset') ?? '0',  10)
    const limit     = Math.min(Math.max(1, isNaN(rawLimit)  ? 20 : rawLimit),  100)
    const offset    = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset)

    const drafts = await listDrafts(user.id, {
      platform: searchParams.get('platform') ?? undefined,
      status:   searchParams.get('status')   ?? undefined,
      ideaId:   searchParams.get('ideaId')   ?? undefined,
      limit,
      offset,
    })

    return NextResponse.json({ drafts, total: drafts.length })
  } catch (err) {
    console.error('[GET /api/drafts]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
