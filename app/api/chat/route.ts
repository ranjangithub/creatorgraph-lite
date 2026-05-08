import { NextResponse } from 'next/server'
import Anthropic        from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `You are CreatorGraph's AI assistant — a knowledgeable, friendly guide for both potential customers and existing users.

## About CreatorGraph
LinkedIn content intelligence platform for professional creators. It builds a structured knowledge graph from your post history and generates daily content briefings grounded in your actual voice, audience, topics, and gaps.

## Core features
- **Knowledge graph**: Claude reads every post you've written, extracting topics, hooks, voice patterns, open audience questions, and content gaps. Your entire archive becomes structured AI memory.
- **Daily briefing**: 3–5 ranked content ideas each day with hook suggestions, rationale, competitor gap analysis, and a validation score.
- **Repetition guard**: Every idea is checked against your archive and flagged as "New angle", "Sequel", or "Repeat" before you write a word.
- **Multi-provider AI**: Use app credits OR bring your own API key (Anthropic, OpenAI, or Google) for unlimited generations billed to your own account.
- **Competitor gap**: Each idea includes what your niche peers are missing — angles only you can write.

## Pricing
- **Free**: $0/mo — 20 AI generations/month, LinkedIn only, basic knowledge graph
- **Creator**: $29/mo — 150 AI generations/month, BYOK (unlimited), 3 platforms, analytics, prompt vault
- **Creator Pro**: $59/mo — 500 AI generations/month, all platforms, draft history, priority processing
- **Enterprise**: $249/mo — unlimited AI, 5 team seats, shared knowledge graph, SSO, dedicated support + SLA

## Early Bird offer
First 100 customers get 50% off their first month on any paid plan. Applied automatically at checkout — no promo code needed.

## Setup (5 minutes total)
1. Sign up free — no credit card required
2. Export LinkedIn data: LinkedIn Settings → Data Privacy → Get a copy of your data → Posts archive (arrives by email in ~10 min)
3. Upload the CSV to CreatorGraph
4. Knowledge graph builds in ~60 seconds
5. Generate your first briefing immediately

## Common support answers
- Monthly generation limit resets on the 1st of each month
- BYOK = Bring Your Own Key — paste your API key in Settings → AI Provider, get unlimited usage billed to your own account
- BYOK is available on Creator and above
- Upgrade is immediate; downgrade takes effect at end of billing period
- Your data export is just a file you own — delete it from the app anytime
- Works with free or premium LinkedIn accounts
- The app uses Anthropic Claude (Haiku model) by default; you can switch to GPT-4 or Gemini with your own key

## Tone & style
Be concise — 2–4 sentences unless they ask for detail. Direct answers, no fluff. Be honest if you don't know. When genuinely relevant, mention how upgrading helps — but don't push if they're not interested. Sound like a knowledgeable founder talking to a smart user, not a sales script.`

const encoder = new TextEncoder()

function mockStream(text: string): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const words = text.split(' ')
      for (const word of words) {
        await new Promise(r => setTimeout(r, 40))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`))
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })
}

const MOCK_RESPONSES: Record<string, string> = {
  default: "I'm CreatorGraph's AI assistant! I can help you understand how CreatorGraph works, answer pricing questions, or support you as an existing user. What would you like to know?",
  pricing: "CreatorGraph offers four plans: Free ($0/mo, 20 AI generations), Creator ($29/mo, 150 generations + BYOK), Creator Pro ($59/mo, 500 generations), and Enterprise ($249/mo, unlimited). Right now the first 100 customers get 50% off their first month — applied automatically at checkout.",
  features: "The core is the knowledge graph — Claude reads your entire LinkedIn post history and extracts topics, hooks, audience questions, and gaps. Every day you get 3–5 briefing ideas grounded in your actual archive, with a repetition guard so you never accidentally repeat yourself.",
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json() as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    // Cap conversation history to last 12 messages
    const history = messages.slice(-12)
    const lastUserMsg = (history.findLast(m => m.role === 'user')?.content ?? '').toLowerCase()

    const apiKey = process.env.ANTHROPIC_API_KEY ?? ''

    // Mock mode for local dev
    if (!apiKey || apiKey.startsWith('sk-mock')) {
      let mock = MOCK_RESPONSES.default
      if (lastUserMsg.includes('price') || lastUserMsg.includes('cost') || lastUserMsg.includes('plan')) mock = MOCK_RESPONSES.pricing
      if (lastUserMsg.includes('feature') || lastUserMsg.includes('work') || lastUserMsg.includes('knowledge')) mock = MOCK_RESPONSES.features
      return new Response(mockStream(mock), {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      })
    }

    const anthropic = new Anthropic({ apiKey })

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.create({
            model:      'claude-haiku-4-5-20251001',
            max_tokens: 512,
            system:     SYSTEM_PROMPT,
            messages:   history,
            stream:     true,
          })

          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              )
            }
          }
        } catch (err) {
          console.error('[chat stream]', err)
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
  } catch (err) {
    console.error('[POST /api/chat]', err)
    return NextResponse.json({ error: 'Chat error' }, { status: 500 })
  }
}
