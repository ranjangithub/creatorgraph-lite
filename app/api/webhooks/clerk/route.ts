import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { Webhook } from 'svix'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'

// Clerk sends user lifecycle events here.
// This keeps our users table in sync with Clerk — the source of truth for auth.

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) return new Response('Missing webhook secret', { status: 500 })

  const headerPayload = await headers()
  const svixId        = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')
  if (!svixId || !svixTimestamp || !svixSignature) return new Response('Missing svix headers', { status: 400 })

  const payload = await req.json()
  const body    = JSON.stringify(payload)

  let evt: WebhookEvent
  try {
    const wh = new Webhook(WEBHOOK_SECRET)
    evt = wh.verify(body, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': svixSignature }) as WebhookEvent
  } catch {
    return new Response('Invalid webhook signature', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    await db.insert(users).values({
      clerkId:  id,
      email:    email_addresses[0]?.email_address ?? '',
      name:     [first_name, last_name].filter(Boolean).join(' ') || null,
      imageUrl: image_url ?? null,
    }).onConflictDoNothing()
  }

  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    await db.update(users)
      .set({
        email:     email_addresses[0]?.email_address ?? '',
        name:      [first_name, last_name].filter(Boolean).join(' ') || null,
        imageUrl:  image_url ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, id))
  }

  if (evt.type === 'user.deleted' && evt.data.id) {
    await db.delete(users).where(eq(users.clerkId, evt.data.id))
  }

  return new Response('OK', { status: 200 })
}
