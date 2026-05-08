import { linkedinAdapter }   from './adapters/linkedin'
import { youtubeAdapter }    from './adapters/youtube'
import { instagramAdapter }  from './adapters/instagram'
import type { Platform, PlatformAdapter } from './types'

const registry: Record<Platform, PlatformAdapter> = {
  linkedin:  linkedinAdapter,
  youtube:   youtubeAdapter,
  instagram: instagramAdapter,
  // Stubs — extend when ready
  medium:    { ...linkedinAdapter,  platform: 'medium',    label: 'Medium',    importSources: () => [{ type: 'url', label: 'Medium article URL', hint: 'Paste a medium.com/... URL' }] },
  substack:  { ...linkedinAdapter,  platform: 'substack',  label: 'Substack',  importSources: () => [{ type: 'url', label: 'Substack post URL',  hint: 'Paste a substack.com/... URL' }] },
  tiktok:    { ...instagramAdapter, platform: 'tiktok',    label: 'TikTok',    importSources: () => [{ type: 'paste', label: 'Paste captions', hint: 'Copy TikTok video captions and paste here' }] },
  other:     { ...linkedinAdapter,  platform: 'other',     label: 'Other',     importSources: () => [{ type: 'paste', label: 'Paste content', hint: 'Paste the text content here' }] },
}

export function getPlatformAdapter(platform: Platform): PlatformAdapter {
  return registry[platform] ?? registry.other
}

export function getActivePlatformAdapters(platforms: string[]): PlatformAdapter[] {
  return platforms.map(p => getPlatformAdapter(p as Platform))
}

export { type Platform, type PlatformAdapter }
