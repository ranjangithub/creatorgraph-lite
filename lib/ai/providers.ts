import type { ProviderConfig, LLMProvider } from './types'

export const PROVIDER_CONFIGS: Record<LLMProvider, ProviderConfig> = {
  app: {
    id:           'app',
    label:        'CreatorGraph AI',
    description:  'Use our shared Anthropic Claude key. Free tier: 20 generations/month.',
    keyLabel:     '',
    keyPrefix:    '',
    keyLink:      '',
    defaultModel: 'claude-sonnet-4-6',
    models:       [{ id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' }],
  },
  anthropic: {
    id:           'anthropic',
    label:        'Anthropic Claude',
    description:  'Use your own Anthropic API key. Unlimited usage, billed to your account.',
    keyLabel:     'Anthropic API Key',
    keyPrefix:    'sk-ant-',
    keyLink:      'https://console.anthropic.com/api-keys',
    defaultModel: 'claude-sonnet-4-6',
    models: [
      { id: 'claude-opus-4-7',         label: 'Claude Opus 4.7 (most capable)' },
      { id: 'claude-sonnet-4-6',       label: 'Claude Sonnet 4.6 (recommended)' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (fastest)' },
    ],
  },
  openai: {
    id:           'openai',
    label:        'OpenAI',
    description:  'Use your own OpenAI API key. GPT-4o and o3-mini supported.',
    keyLabel:     'OpenAI API Key',
    keyPrefix:    'sk-',
    keyLink:      'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-4o',
    models: [
      { id: 'gpt-4o',      label: 'GPT-4o (recommended)' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (faster, cheaper)' },
      { id: 'o3-mini',     label: 'o3-mini (reasoning)' },
    ],
  },
  google: {
    id:           'google',
    label:        'Google Gemini',
    description:  'Use your own Google AI API key. Gemini 1.5 Pro and Flash supported.',
    keyLabel:     'Google AI API Key',
    keyPrefix:    'AIza',
    keyLink:      'https://aistudio.google.com/app/apikey',
    defaultModel: 'gemini-1.5-pro',
    models: [
      { id: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro (recommended)' },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (fastest)' },
    ],
  },
}

export const ALL_PROVIDERS = Object.values(PROVIDER_CONFIGS)
export const BYOK_PROVIDERS = ALL_PROVIDERS.filter(p => p.id !== 'app')

export const FREE_TIER_LIMIT = 20   // AI calls per month
