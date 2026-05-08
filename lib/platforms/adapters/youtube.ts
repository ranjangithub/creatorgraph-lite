import type { PlatformAdapter, ContentType, PlatformMetrics } from '../types'

export const youtubeAdapter: PlatformAdapter = {
  platform: 'youtube',
  label:    'YouTube',

  supportedEntityTypes:  ['personal', 'brand_channel'],
  supportedContentTypes: ['video', 'short'],

  normaliseEngagement({ likes = 0, comments = 0, views = 0 }) {
    if (!views) return 0
    // YouTube: comments signal deep engagement, likes are cheap
    const raw = (likes * 1 + comments * 8) / views * 1000
    return Math.min(100, Math.round(raw))
  },

  getBriefingHints(contentType: ContentType): string {
    const base = 'YouTube rewards curiosity-gap titles and strong opening 30 seconds. The hook must make them stay.'
    const map: Partial<Record<ContentType, string>> = {
      video: `${base} Output: title (curiosity-gap, under 60 chars) + 5-point outline + opening hook script (first 45 seconds). Include a thumbnail angle suggestion.`,
      short: `${base} Shorts: 15-60 seconds. Hook in first 3 seconds. Single punchy idea. No intro, no outro, no filler.`,
    }
    return map[contentType] ?? base
  },

  importSources() {
    return [
      { type: 'url',   label: 'YouTube video URL',    hint: 'Paste a youtube.com/watch?v=... URL — we extract the transcript' },
      { type: 'paste', label: 'Paste transcript',     hint: 'Copy transcript from YouTube and paste here' },
    ]
  },
}
