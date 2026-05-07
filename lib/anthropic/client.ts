import Anthropic from '@anthropic-ai/sdk'

export const isMockMode = process.env.ANTHROPIC_API_KEY === 'sk-mock'

// Single shared client — server-side only.
// In mock mode the client is constructed but never called (each prompt
// function checks isMockMode and returns fixtures before hitting the API).
export const anthropic = new Anthropic({
  apiKey: isMockMode ? 'sk-ant-mock-placeholder' : process.env.ANTHROPIC_API_KEY!,
})

export const MODEL = 'claude-sonnet-4-6'
export const MAX_TOKENS = 8096

// Context Engineering: how much of the context window to use for memory
// Karpathy's insight: load the right slice, not everything
export const CONTEXT_LIMITS = {
  memoryEntries:    50,   // max memory entries to load per request
  contentItems:     20,   // max past posts to include
  contextMaxChars:  80000, // ~20K tokens — leaves room for response
} as const
