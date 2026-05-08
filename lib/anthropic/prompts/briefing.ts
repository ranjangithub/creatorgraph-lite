import { SystemMessage, HumanMessage } from '@langchain/core/messages'
import type { BaseChatModel }          from '@langchain/core/language_models/chat_models'
import { isMockMode }                  from '@/lib/anthropic/client'
import { MOCK_BRIEFING }               from '@/lib/mock/fixtures'
import type { CreatorContext }          from '@/lib/anthropic/context/loader'

export interface BriefingResult {
  summary:     string
  ideas:       IdeaSuggestion[]
  rawResponse: string
}

export interface IdeaSuggestion {
  title:           string
  hook:            string
  rationale:       string
  audienceFit:     string
  competitorGap:   string
  repetitionRisk:  string   // 'new' | 'sequel' | 'repeat'
  validationScore: number   // 0–100
}

const SYSTEM_PROMPT = `You are a content strategist with deep knowledge of this creator's entire history.
You have access to their memory, past content, and competitor landscape.

Your job: recommend the creator's next best LinkedIn article — backed by their own evidence.

Rules:
- Start from the creator's memory and history. Not generic trends.
- Every idea must show: why now, why them, audience fit, competitor gap, repetition risk.
- Flag if an idea is a REPEAT (creator has covered this), a SEQUEL (natural follow-up), or NEW.
- Validate each idea: is this worth pursuing today? Score 0-100.
- The best idea is the next logical move in the creator's body of work, not a generic suggestion.
- Be direct. No filler. Lead with the recommendation.`

export async function generateBriefing(
  ctx:   CreatorContext,
  model: BaseChatModel,
): Promise<BriefingResult> {
  if (isMockMode) return MOCK_BRIEFING

  const userPrompt = `${ctx.memoryBlock}${ctx.recentContent}${ctx.competitorBlock}

Today is ${new Date().toISOString().split('T')[0]}.

Generate a daily briefing with 3-5 LinkedIn article ideas. For each idea return a JSON object.

Return ONLY valid JSON in this exact shape:
{
  "summary": "2-3 sentence overview of what the data is telling us today",
  "ideas": [
    {
      "title": "Article title",
      "hook": "Opening line that grabs attention",
      "rationale": "Why this idea now, why this creator",
      "audienceFit": "Who this is for and why they care",
      "competitorGap": "What competitors are missing or overusing",
      "repetitionRisk": "new|sequel|repeat — and why",
      "validationScore": 85
    }
  ]
}`

  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(userPrompt),
  ])

  const raw = typeof response.content === 'string'
    ? response.content
    : (response.content[0] as { text?: string })?.text ?? ''

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('LLM did not return valid JSON for briefing')

  const parsed = JSON.parse(jsonMatch[0]) as BriefingResult
  return { ...parsed, rawResponse: raw }
}
