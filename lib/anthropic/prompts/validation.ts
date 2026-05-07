import { anthropic, MODEL, MAX_TOKENS } from '@/lib/anthropic/client'
import type { CreatorContext } from '@/lib/anthropic/context/loader'

export interface ValidationResult {
  score:           number   // 0-100
  verdict:         'pursue' | 'reconsider' | 'skip'
  reasoning:       string
  repetitionCheck: string   // 'new' | 'sequel' | 'repeat'
  historicalEvidence: string
  recommendation: string
}

// ── Validation prompt ──────────────────────────────────────────────────────
// Answers: "Should I even write this today?"
// Uses historical evidence — not generic trend data.
// This is Layer 2 of the CreatorGraph stack.

export async function validateContentIdea(
  idea: string,
  ctx: CreatorContext
): Promise<ValidationResult> {

  const prompt = `You are validating whether a content idea is worth pursuing today, based on the creator's history.

CREATOR MEMORY:
${ctx.memoryBlock}

RECENT CONTENT:
${ctx.recentContent}

IDEA TO VALIDATE:
"${idea}"

Answer these questions using ONLY the creator's historical evidence:
1. Has this creator covered this topic before? If yes, how recently and how thoroughly?
2. Did similar content perform well or poorly for them?
3. Is there genuine new angle here, or is this a repeat?
4. Is the timing right based on their audience's recent engagement patterns?
5. Is this the next logical step in their body of work?

Return ONLY valid JSON:
{
  "score": 82,
  "verdict": "pursue",
  "reasoning": "Evidence-based reasoning from their history",
  "repetitionCheck": "sequel",
  "historicalEvidence": "Specific posts and performance data that support this verdict",
  "recommendation": "One clear action sentence"
}`

  const response = await anthropic.messages.create({
    model:      MODEL,
    max_tokens: 1024,
    messages:   [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Validation did not return valid JSON')

  return JSON.parse(jsonMatch[0]) as ValidationResult
}
