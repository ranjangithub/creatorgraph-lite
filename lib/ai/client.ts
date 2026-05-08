import { ChatAnthropic }            from '@langchain/anthropic'
import { ChatOpenAI }               from '@langchain/openai'
import { ChatGoogleGenerativeAI }   from '@langchain/google-genai'
import type { BaseChatModel }       from '@langchain/core/language_models/chat_models'

import { decrypt }                  from '@/lib/encrypt'
import {
  getLLMSettings,
  resetUsageIfNewMonth,
  incrementUsage,
  getSubscription,
}                                   from '@/lib/db/queries/users'
import { PROVIDER_CONFIGS, FREE_TIER_LIMIT } from './providers'
import { LLMLimitError }            from './types'
import type { ResolvedLLM, LLMProvider } from './types'
import { getAILimit, canUseBYOK }   from '@/lib/stripe/config'
import type { SubscriptionTier }    from '@/lib/stripe/config'

const APP_ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY ?? ''
const APP_DEFAULT_MODEL  = PROVIDER_CONFIGS.app.defaultModel

function buildModel(provider: LLMProvider, apiKey: string, model: string): BaseChatModel {
  switch (provider) {
    case 'app':
    case 'anthropic':
      return new ChatAnthropic({ apiKey, model, temperature: 0.7 }) as unknown as BaseChatModel
    case 'openai':
      return new ChatOpenAI({ apiKey, model, temperature: 0.7 }) as unknown as BaseChatModel
    case 'google':
      return new ChatGoogleGenerativeAI({ apiKey, model, temperature: 0.7 }) as unknown as BaseChatModel
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

export async function getLLMClient(userId: string): Promise<ResolvedLLM> {
  const [settings, subscription] = await Promise.all([
    getLLMSettings(userId),
    getSubscription(userId),
  ])
  if (!settings) throw new Error('User not found')

  const provider = (settings.llmProvider ?? 'app') as LLMProvider
  const tier     = (subscription?.subscriptionTier ?? 'free') as SubscriptionTier
  const isActive = !subscription?.subscriptionStatus ||
                   subscription.subscriptionStatus === 'active' ||
                   subscription.subscriptionStatus === 'trialing'

  // ── BYOK path ─────────────────────────────────────────────────────────────
  if (provider !== 'app' && settings.llmApiKey) {
    // Ensure BYOK is unlocked on this tier
    if (!canUseBYOK(isActive ? tier : 'free')) {
      throw new Error('Upgrade to Creator or higher to use your own API key.')
    }
    const apiKey = decrypt(settings.llmApiKey)
    const config = PROVIDER_CONFIGS[provider]
    const model  = settings.llmModel ?? config.defaultModel
    return {
      model:       buildModel(provider, apiKey, model),
      provider,
      usingOwnKey: true,
    }
  }

  // ── App shared key (tiered limits) ────────────────────────────────────────
  await resetUsageIfNewMonth(userId)
  const freshSettings = await getLLMSettings(userId)
  const used    = freshSettings?.monthlyUsage ?? 0
  const limit   = isActive ? getAILimit(tier, false) : FREE_TIER_LIMIT

  if (used >= limit) {
    throw new LLMLimitError(used, limit)
  }

  const remaining = limit === Infinity ? Infinity : limit - used - 1
  await incrementUsage(userId)

  return {
    model:       buildModel('anthropic', APP_ANTHROPIC_KEY, APP_DEFAULT_MODEL),
    provider:    'app',
    usingOwnKey: false,
    remaining:   remaining === Infinity ? undefined : remaining,
  }
}
