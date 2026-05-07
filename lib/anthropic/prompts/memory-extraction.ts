import { anthropic, MODEL, MAX_TOKENS } from '@/lib/anthropic/client'

export interface ExtractedMemory {
  type:       string
  content:    string
  confidence: number
  tags:       string[]
}

// ── Memory extraction prompt ───────────────────────────────────────────────
// Reads a batch of content items and extracts structured memories.
// Runs once per import batch — not on every query.
// This is what turns raw content into the living knowledge graph.

export async function extractMemoriesFromContent(
  contentBatch: Array<{ title?: string; body: string; platform: string; publishedAt?: string; views?: number; likes?: number; comments?: number }>
): Promise<ExtractedMemory[]> {

  const contentBlock = contentBatch.map((c, i) =>
    `[${i + 1}] ${c.platform.toUpperCase()} | ${c.publishedAt ?? 'unknown date'}\nTitle: ${c.title ?? 'untitled'}\nPerformance: views=${c.views ?? 0} likes=${c.likes ?? 0} comments=${c.comments ?? 0}\n${c.body.slice(0, 1000)}`
  ).join('\n\n---\n\n')

  const prompt = `You are analyzing a creator's content archive to extract structured memories.

For each piece of content, identify:
- topic_expertise: Topics the creator clearly knows deeply
- audience_question: Questions the audience asked (in comments or implied by post)
- voice_pattern: Recurring phrases, analogies, tone markers that define their voice
- abandoned_idea: Topics mentioned but never fully explored
- performance_insight: What worked and what didn't, with evidence

Return a JSON array of memory entries. Each entry:
{
  "type": "topic_expertise|audience_question|voice_pattern|abandoned_idea|performance_insight",
  "content": "Clear, specific, one-sentence memory",
  "confidence": 85,
  "tags": ["tag1", "tag2"]
}

Only extract confident, specific insights. Skip vague generalities.

CONTENT ARCHIVE:
${contentBlock}

Return ONLY a valid JSON array.`

  const response = await anthropic.messages.create({
    model:      MODEL,
    max_tokens: MAX_TOKENS,
    messages:   [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '[]'
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  return JSON.parse(jsonMatch[0]) as ExtractedMemory[]
}
