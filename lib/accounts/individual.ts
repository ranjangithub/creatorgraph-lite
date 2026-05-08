import type { AccountStrategy, VoiceProfile } from './types'

export class IndividualAccountStrategy implements AccountStrategy {
  readonly accountType = 'individual' as const

  constructor(
    private readonly userName: string,
    private readonly niche?: string,
    private readonly toneWords: string[] = [],
  ) {}

  getVoiceProfile(): VoiceProfile {
    return {
      perspective: 'first_person',
      toneWords:   this.toneWords.length ? this.toneWords : ['authentic', 'direct', 'opinionated'],
      avoids:      ['generic advice', 'corporate speak'],
    }
  }

  getBriefingPersona(): string {
    const nicheClause = this.niche ? ` focused on ${this.niche}` : ''
    return `You are writing as ${this.userName}, an individual creator${nicheClause}. Write in first person. Be opinionated, specific, and grounded in personal experience.`
  }

  getContentPurposes(): string[] {
    return ['thought_leadership', 'education', 'personal_story', 'engagement']
  }

  canManageTeam():  boolean { return false }
  canAccessOrg():   boolean { return false }
}
