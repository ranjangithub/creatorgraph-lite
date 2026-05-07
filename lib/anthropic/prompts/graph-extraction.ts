import { anthropic, MODEL, MAX_TOKENS } from '@/lib/anthropic/client'

// ── Node types returned by graph extraction ────────────────────────────────

export interface GraphExtraction {
  topics: Array<{
    name:        string
    parentTopic: string | null  // higher-order concept, e.g. "software engineering"
    hasGap:      boolean        // true = audience asks about this but creator hasn't covered it
    confidence:  number         // 0-100
  }>
  hooks: Array<{
    text:       string
    hookType:   'analogy' | 'framework' | 'opener' | 'statistic' | 'question'
    confidence: number
  }>
  audienceSegments: string[]   // "CTOs" | "founders" | "students" etc.
  audienceQuestions: Array<{
    question:  string
    painPoint: string           // the underlying frustration or need
    segments:  string[]         // which segments asked this
    resolved:  boolean          // did the creator ever directly answer this?
  }>
  contentTags: Array<{
    index:   number             // 1-based, matches [N] in the prompt
    topics:  string[]           // topic names this content covers
    hooks:   string[]           // hook texts used in this content
  }>
}

// ── Extract knowledge graph from a batch of content ───────────────────────
// Runs once per import batch. Returns structured nodes ready to upsert.
// The contentTags array links individual posts to the topics and hooks they use.

export async function extractGraphFromContent(
  contentBatch: Array<{
    index:       number
    title?:      string
    body:        string
    platform:    string
    publishedAt?: string
    views?:      number
    likes?:      number
    comments?:   number
  }>
): Promise<GraphExtraction> {

  const contentBlock = contentBatch.map(c =>
    `[${c.index}] ${c.platform.toUpperCase()} | ${c.publishedAt ?? 'unknown date'}
Title: ${c.title ?? 'untitled'}
Performance: views=${c.views ?? 0} likes=${c.likes ?? 0} comments=${c.comments ?? 0}
${c.body.slice(0, 800)}`
  ).join('\n\n---\n\n')

  const prompt = `You are building a knowledge graph for a content creator. Analyse their content archive and extract structured graph nodes.

Extract the following node types:

**TOPICS** — Specific subjects this creator covers. Include both specific topics ("PostgreSQL indexing") and higher-order themes ("database engineering"). Mark hasGap=true if the audience clearly wants more on this topic but the creator hasn't written about it.

**HOOKS** — Reusable creative assets: analogies, frameworks, openers, statistics, rhetorical questions. Only extract hooks that are actually reusable, not one-time phrases.
Hook types: analogy | framework | opener | statistic | question

**AUDIENCE SEGMENTS** — Groups of people who engage with this content: "CTOs", "startup founders", "junior engineers", etc. Only groups clearly implied by the content.

**AUDIENCE QUESTIONS** — Questions or objections the audience has, extracted from the content (implied by what the creator addresses, or clearly from comments). Mark resolved=false if the creator raises the question but doesn't fully answer it.

**CONTENT TAGS** — For each content item [N], list which of the above topics and hooks it uses.

CONTENT ARCHIVE:
${contentBlock}

Return ONLY a valid JSON object with this exact shape:
{
  "topics": [
    { "name": "string", "parentTopic": "string or null", "hasGap": false, "confidence": 85 }
  ],
  "hooks": [
    { "text": "string", "hookType": "analogy|framework|opener|statistic|question", "confidence": 80 }
  ],
  "audienceSegments": ["string"],
  "audienceQuestions": [
    { "question": "string", "painPoint": "string", "segments": ["string"], "resolved": false }
  ],
  "contentTags": [
    { "index": 1, "topics": ["string"], "hooks": ["string"] }
  ]
}`

  const response = await anthropic.messages.create({
    model:      MODEL,
    max_tokens: MAX_TOKENS,
    messages:   [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return empty()

  try {
    return JSON.parse(jsonMatch[0]) as GraphExtraction
  } catch {
    return empty()
  }
}

function empty(): GraphExtraction {
  return { topics: [], hooks: [], audienceSegments: [], audienceQuestions: [], contentTags: [] }
}
