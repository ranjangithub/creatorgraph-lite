import { ChatAnthropic }            from '@langchain/anthropic'
import { ChatOpenAI }               from '@langchain/openai'
import { ChatGoogleGenerativeAI }   from '@langchain/google-genai'
import type { BaseChatModel }       from '@langchain/core/language_models/chat_models'

import { decrypt }                  from '@/lib/encrypt'
import { getLLMSettings, resetUsageIfNewMonth, incrementUsage } from '@/lib/db/queries/users'
import { PROVIDER_CONFIGS, FREE_TIER_LIMIT } from './providers'
import { LLMLimitError }            from './types'
import type { ResolvedLLM, LLMProvider } from './types'

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
  const settings = await getLLMSettings(userId)
  if (!settings) throw new Error('User not found')

  const provider = (settings.llmProvider ?? 'app') as LLMProvider

  // ── BYOK path ─────────────────────────────────────────────────────────────
  if (provider !== 'app') {
    if (!settings.llmApiKey) {
      throw new Error(`No API key saved for provider "${provider}". Add one in Settings.`)
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

  // ── App shared key (free tier) ─────────────────────────────────────────────
  await resetUsageIfNewMonth(userId)
  const freshSettings = await getLLMSettings(userId)
  const used = freshSettings?.monthlyUsage ?? 0

  if (used >= FREE_TIER_LIMIT) {
    throw new LLMLimitError(used, FREE_TIER_LIMIT)
  }

  const remaining = FREE_TIER_LIMIT - used - 1
  await incrementUsage(userId)

  return {
    model:       buildModel('anthropic', APP_ANTHROPIC_KEY, APP_DEFAULT_MODEL),
    provider:    'app',
    usingOwnKey: false,
    remaining,
  }
}
