import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

export type LLMProvider = 'app' | 'anthropic' | 'openai' | 'google'

export interface ProviderConfig {
  id:          LLMProvider
  label:       string
  description: string               // shown in settings UI
  keyLabel:    string               // e.g. "Anthropic API Key"
  keyPrefix:   string               // e.g. "sk-ant-" — shown as hint
  keyLink:     string               // URL to get the key
  defaultModel: string
  models:      { id: string; label: string }[]
}

export interface ResolvedLLM {
  model:        BaseChatModel
  provider:     LLMProvider
  usingOwnKey:  boolean
  remaining?:   number              // only set when usingOwnKey=false
}

export class LLMLimitError extends Error {
  constructor(
    public readonly used:  number,
    public readonly limit: number,
  ) {
    super(`Monthly AI limit reached (${used}/${limit}). Add your own API key in Settings to continue.`)
    this.name = 'LLMLimitError'
  }
}
