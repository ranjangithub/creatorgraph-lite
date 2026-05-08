import { IndividualAccountStrategy } from './individual'
import { EnterpriseAccountStrategy } from './enterprise'
import type { AccountStrategy } from './types'

interface UserRecord {
  accountType: string
  name:        string | null
  niche?:      string | null
  org?: {
    name:            string
    industry?:       string | null
    brandVoice?:     string | null
    contentPillars?: string[]
  } | null
}

export function getAccountStrategy(user: UserRecord): AccountStrategy {
  if (user.accountType === 'enterprise' && user.org) {
    return new EnterpriseAccountStrategy(
      user.org.name,
      user.org.industry ?? undefined,
      user.org.brandVoice ?? undefined,
      user.org.contentPillars ?? [],
    )
  }

  return new IndividualAccountStrategy(
    user.name ?? 'the creator',
    user.niche ?? undefined,
  )
}
