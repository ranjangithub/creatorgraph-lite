import { NextResponse }    from 'next/server'
import { getOrCreateDbUser } from '@/lib/auth'
import { getLLMSettings, saveLLMSettings } from '@/lib/db/queries/users'
import { encrypt, maskApiKey } from '@/lib/encrypt'
import { PROVIDER_CONFIGS, FREE_TIER_LIMIT } from '@/lib/ai/providers'
import type { LLMProvider } from '@/lib/ai/types'

// GET /api/settings/llm — return current provider, masked key, usage
export async function GET() {
  try {
    const user = await getOrCreateDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const settings = await getLLMSettings(user.id)
    if (!settings) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const provider  = (settings.llmProvider ?? 'app') as LLMProvider
    const config    = PROVIDER_CONFIGS[provider]
    const maskedKey = settings.llmApiKey ? maskApiKey('masked') : null  // never expose raw encrypted value

    return NextResponse.json({
      provider,
      model:        settings.llmModel ?? config.defaultModel,
      hasKey:       !!settings.llmApiKey,
      maskedKey,
      monthlyUsage: settings.monthlyUsage ?? 0,
      monthlyLimit: FREE_TIER_LIMIT,
      usingOwnKey:  provider !== 'app',
    })
  } catch (err) {
    console.error('[GET /api/settings/llm]', err)
    return NextResponse.json({ error: 'Failed to load LLM settings' }, { status: 500 })
  }
}

// POST /api/settings/llm — save provider + key + model
export async function POST(req: Request) {
  try {
    const user = await getOrCreateDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json() as {
      provider: LLMProvider
      apiKey?:  string
      model?:   string
    }

    const { provider, apiKey, model } = body

    if (!provider || !PROVIDER_CONFIGS[provider]) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    // BYOK providers require an API key
    if (provider !== 'app' && !apiKey) {
      return NextResponse.json({ error: 'API key is required for this provider' }, { status: 400 })
    }

    // Validate key prefix if provided
    if (apiKey && provider !== 'app') {
      const config = PROVIDER_CONFIGS[provider]
      if (config.keyPrefix && !apiKey.startsWith(config.keyPrefix)) {
        return NextResponse.json(
          { error: `Key should start with "${config.keyPrefix}"` },
          { status: 400 },
        )
      }
    }

    const encryptedKey = apiKey ? encrypt(apiKey) : null
    const resolvedModel = model ?? PROVIDER_CONFIGS[provider].defaultModel

    await saveLLMSettings(user.id, provider, encryptedKey, resolvedModel)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/settings/llm]', err)
    return NextResponse.json({ error: 'Failed to save LLM settings' }, { status: 500 })
  }
}

// DELETE /api/settings/llm — remove stored API key, revert to free tier
export async function DELETE() {
  try {
    const user = await getOrCreateDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await saveLLMSettings(user.id, 'app', null, null)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/settings/llm]', err)
    return NextResponse.json({ error: 'Failed to remove API key' }, { status: 500 })
  }
}
