import type { PlatformAdapter, ContentType, PlatformMetrics } from '../types'

export const linkedinAdapter: PlatformAdapter = {
  platform: 'linkedin',
  label:    'LinkedIn',

  supportedEntityTypes:  ['personal', 'company_page'],
  supportedContentTypes: ['post', 'article', 'carousel', 'newsletter'],

  normaliseEngagement({ likes = 0, comments = 0, shares = 0, impressions = 0 }) {
    if (!impressions) return 0
    // LinkedIn weights: comments most valuable, then shares, then likes
    const raw = (likes * 2 + comments * 5 + shares * 4) / impressions * 1000
    return Math.min(100, Math.round(raw))
  },

  getBriefingHints(contentType: ContentType): string {
    const base = 'LinkedIn rewards specificity and strong takes. Avoid fluff. Start with the hook — no preamble.'
    const map: Partial<Record<ContentType, string>> = {
      post:      `${base} Max ~1,200 chars. Use line breaks, not walls of text. End with a soft CTA or question.`,
      article:   `${base} Long-form (800-2,000 words). Subheadings every 3-4 paragraphs. Personal angle wins over generic.`,
      carousel:  `${base} 6-10 slides. Slide 1 = hook. Each slide = one idea. Last slide = CTA. Keep copy minimal per slide.`,
      newsletter: `${base} LinkedIn Newsletter: conversational, value-dense, 500-800 words. Subject line is the hook.`,
    }
    return map[contentType] ?? base
  },

  importSources() {
    return [
      { type: 'file',  label: 'LinkedIn CSV export',  hint: 'Download from LinkedIn Settings → Data Privacy → Get a copy of your data' },
      { type: 'url',   label: 'LinkedIn article URL', hint: 'Paste a linkedin.com/pulse/... URL' },
    ]
  },
}
