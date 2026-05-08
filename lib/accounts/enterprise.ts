import type { AccountStrategy, VoiceProfile } from './types'

export class EnterpriseAccountStrategy implements AccountStrategy {
  readonly accountType = 'enterprise' as const

  constructor(
    private readonly orgName: string,
    private readonly industry?: string,
    private readonly brandVoice?: string,
    private readonly contentPillars: string[] = [],
    private readonly toneWords: string[] = [],
  ) {}

  getVoiceProfile(): VoiceProfile {
    return {
      perspective:     'brand',
      toneWords:       this.toneWords.length ? this.toneWords : ['professional', 'credible', 'helpful'],
      avoids:          ['salesy language', 'hype', 'unsubstantiated claims'],
      brandVoice:      this.brandVoice,
      contentPillars:  this.contentPillars,
    }
  }

  getBriefingPersona(): string {
    const industryClause = this.industry ? ` in the ${this.industry} space` : ''
    const pillarsClause  = this.contentPillars.length
      ? ` Content pillars: ${this.contentPillars.join(', ')}.`
      : ''
    const voiceClause    = this.brandVoice ? ` Brand voice: ${this.brandVoice}.` : ''

    return `You are writing as ${this.orgName}, a company${industryClause}. Write from the brand perspective ("we", "our team").${pillarsClause}${voiceClause} Focus on building authority and trust, not selling.`
  }

  getContentPurposes(): string[] {
    return ['thought_leadership', 'product', 'culture', 'education', 'announcement', 'hiring']
  }

  canManageTeam():  boolean { return true }
  canAccessOrg():   boolean { return true }
}
