export type Platform = 'linkedin' | 'youtube' | 'instagram' | 'medium' | 'substack' | 'tiktok' | 'other'

export type EntityType = 'personal' | 'company_page' | 'brand_channel'

export type ContentType = 'post' | 'video' | 'reel' | 'carousel' | 'article' | 'short' | 'story' | 'newsletter'

export type PostPurpose =
  | 'thought_leadership'
  | 'product'
  | 'culture'
  | 'education'
  | 'personal_story'
  | 'announcement'
  | 'engagement'
  | 'hiring'

export interface PlatformMetrics {
  likes:        number
  comments:     number
  shares:       number
  saves:        number
  impressions:  number
  views:        number
}

export interface BriefingOutput {
  platform:     Platform
  contentType:  ContentType
  draft:        string            // ready-to-post text
  hook:         string            // opening line / title
  extras:       Record<string, string>  // platform-specific: hashtags, outline, slides, etc.
}

export interface PlatformAdapter {
  platform:         Platform
  label:            string          // "LinkedIn", "YouTube", etc.
  supportedEntityTypes: EntityType[]
  supportedContentTypes: ContentType[]
  // Normalise raw metrics → 0-100 engagement score
  normaliseEngagement(metrics: Partial<PlatformMetrics>): number
  // Prompt hint injected into briefing generation
  getBriefingHints(contentType: ContentType): string
  // Import source description shown in UI
  importSources(): Array<{ type: 'file' | 'url' | 'paste'; label: string; hint: string }>
}
