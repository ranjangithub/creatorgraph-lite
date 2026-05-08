import type { PlatformAdapter, ContentType, PlatformMetrics } from '../types'

export const instagramAdapter: PlatformAdapter = {
  platform: 'instagram',
  label:    'Instagram',

  supportedEntityTypes:  ['personal', 'company_page'],
  supportedContentTypes: ['reel', 'carousel', 'post', 'story'],

  normaliseEngagement({ likes = 0, comments = 0, saves = 0, impressions = 0 }) {
    if (!impressions) return 0
    // Instagram: saves signal intent to return (highest value), comments = conversation
    const raw = (likes * 1 + comments * 4 + saves * 8) / impressions * 1000
    return Math.min(100, Math.round(raw))
  },

  getBriefingHints(contentType: ContentType): string {
    const base = 'Instagram is visual-first. The caption supports the visual — it does not replace it.'
    const map: Partial<Record<ContentType, string>> = {
      reel:     `${base} Reels: hook in first 3 seconds on-screen. Caption: 150 chars max, punchy. Include 5-8 hashtags (niche > broad). End with a save-worthy takeaway.`,
      carousel: `${base} Carousels drive saves. Slide 1 = hook + promise. Slides 2-8 = one insight each. Last slide = summary + CTA. Caption brief (under 200 chars).`,
      post:     `${base} Single image post. Caption is the content. Lead with the first line (visible before "more"). Keep under 300 chars. Include 3-5 hashtags.`,
      story:    `${base} Stories are ephemeral — be raw and direct. One idea per frame. Use polls/questions to drive replies.`,
    }
    return map[contentType] ?? base
  },

  importSources() {
    return [
      { type: 'paste', label: 'Paste captions',       hint: 'Copy your Instagram post captions and paste them here' },
      { type: 'file',  label: 'Caption CSV',           hint: 'Export a spreadsheet of your captions and upload as CSV' },
    ]
  },
}
