export type AccountType = 'individual' | 'enterprise'

export type OrgRole = 'admin' | 'editor' | 'viewer'

export interface VoiceProfile {
  // Individual: written in first person ("I believe...", "My take...")
  // Enterprise: written as brand ("We help...", "At Acme...")
  perspective:  'first_person' | 'brand'
  // Tone descriptors extracted from past content
  toneWords:    string[]           // e.g. ["direct", "data-driven", "opinionated"]
  // What this account avoids
  avoids:       string[]           // e.g. ["salesy language", "jargon"]
  // Brand-only: explicit guidelines
  brandVoice?:  string             // free-text from org settings
  contentPillars?: string[]
}

export interface AccountContext {
  accountType:  AccountType
  userId:       string
  orgId?:       string
  orgName?:     string
  userRole?:    OrgRole            // enterprise only
  voice:        VoiceProfile
  activePlatforms: string[]
  niche?:       string
}

export interface AccountStrategy {
  accountType:          AccountType
  getVoiceProfile():    VoiceProfile
  getBriefingPersona(): string      // injected into AI prompts
  getContentPurposes(): string[]    // available post purpose options
  canManageTeam():      boolean
  canAccessOrg():       boolean
}
