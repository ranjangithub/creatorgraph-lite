import type { AccountStrategy }  from '@/lib/accounts/types'
import type { Platform, ContentType, PostPurpose, BriefingOutput } from '@/lib/platforms/types'
import { getPlatformAdapter } from '@/lib/platforms/registry'

export interface BriefingRequest {
  topic:         string
  context:       string          // memory / past content summary
  targetPlatform: Platform
  contentType:   ContentType
  postPurpose?:  PostPurpose
  accountStrategy: AccountStrategy
}

export function buildBriefingPrompt(req: BriefingRequest): string {
  const adapter  = getPlatformAdapter(req.targetPlatform)
  const persona  = req.accountStrategy.getBriefingPersona()
  const hints    = adapter.getBriefingHints(req.contentType)
  const purposes = req.accountStrategy.getContentPurposes()

  const purposeClause = req.postPurpose && purposes.includes(req.postPurpose)
    ? `\nContent purpose: ${req.postPurpose.replace(/_/g, ' ')}.`
    : ''

  return `${persona}

Platform: ${adapter.label} (${req.contentType})${purposeClause}
${hints}

Creator context:
${req.context}

Topic to write about: ${req.topic}

Generate a ready-to-post ${req.contentType} for ${adapter.label}. Return JSON:
{
  "hook": "<opening line or title>",
  "draft": "<full ready-to-post text>",
  "extras": { <platform-specific fields: hashtags, outline, slides, thumbnail, etc.> }
}`
}

export function parseBriefingOutput(raw: string, platform: Platform, contentType: ContentType): BriefingOutput {
  try {
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    return {
      platform,
      contentType,
      hook:   json.hook   ?? '',
      draft:  json.draft  ?? raw,
      extras: json.extras ?? {},
    }
  } catch {
    return { platform, contentType, hook: '', draft: raw, extras: {} }
  }
}
