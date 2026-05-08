'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button }    from '@/components/ui/button'
import { Input }     from '@/components/ui/input'
import { Label }     from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge }     from '@/components/ui/badge'
import { Progress }  from '@/components/ui/progress'
import { AlertCircle, CheckCircle2, ExternalLink, Trash2 } from 'lucide-react'
import { PROVIDER_CONFIGS, BYOK_PROVIDERS, FREE_TIER_LIMIT } from '@/lib/ai/providers'
import type { LLMProvider } from '@/lib/ai/types'

interface LLMState {
  provider:     LLMProvider
  model:        string
  hasKey:       boolean
  monthlyUsage: number
  monthlyLimit: number
  usingOwnKey:  boolean
}

export function LLMSettings() {
  const [state, setState]     = useState<LLMState | null>(null)
  const [provider, setProvider] = useState<LLMProvider>('app')
  const [model, setModel]     = useState<string>('')
  const [apiKey, setApiKey]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/settings/llm')
      .then(r => r.json())
      .then((data: LLMState) => {
        setState(data)
        setProvider(data.provider)
        setModel(data.model)
      })
      .catch(() => setMessage({ type: 'error', text: 'Could not load settings.' }))
  }, [])

  const selectedConfig  = PROVIDER_CONFIGS[provider]
  const availableModels = selectedConfig?.models ?? []
  const usagePct        = state ? Math.min(100, (state.monthlyUsage / FREE_TIER_LIMIT) * 100) : 0
  const remaining       = FREE_TIER_LIMIT - (state?.monthlyUsage ?? 0)

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const body: Record<string, string> = { provider, model }
      if (provider !== 'app' && apiKey) body.apiKey = apiKey

      const res = await fetch('/api/settings/llm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')

      setMessage({ type: 'success', text: 'Settings saved.' })
      setApiKey('')
      // Reload state
      const refreshed = await fetch('/api/settings/llm').then(r => r.json())
      setState(refreshed)
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveKey() {
    setDeleting(true)
    setMessage(null)
    try {
      await fetch('/api/settings/llm', { method: 'DELETE' })
      setProvider('app')
      setApiKey('')
      const refreshed = await fetch('/api/settings/llm').then(r => r.json())
      setState(refreshed)
      setMessage({ type: 'success', text: 'API key removed. Switched to free tier.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove key.' })
    } finally {
      setDeleting(false)
    }
  }

  if (!state) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Provider</CardTitle>
        <CardDescription>
          Choose which AI model powers your briefings and drafts. Use our free shared key
          or bring your own for unlimited usage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Free tier usage meter */}
        {!state.usingOwnKey && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Free tier usage this month</span>
              <span className="text-muted-foreground">
                {state.monthlyUsage} / {FREE_TIER_LIMIT} generations
              </span>
            </div>
            <Progress value={usagePct} className="h-2" />
            {remaining <= 5 && remaining > 0 && (
              <p className="text-xs text-amber-600">
                {remaining} generation{remaining === 1 ? '' : 's'} remaining. Add your own key for unlimited usage.
              </p>
            )}
            {remaining <= 0 && (
              <p className="text-xs text-red-600 font-medium">
                Monthly limit reached. Add your own API key below to continue.
              </p>
            )}
          </div>
        )}

        {/* Provider picker */}
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={provider} onValueChange={(v: string) => {
            setProvider(v as LLMProvider)
            setModel(PROVIDER_CONFIGS[v as LLMProvider].defaultModel)
            setApiKey('')
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="app">
                <div className="flex items-center gap-2">
                  <span>CreatorGraph AI</span>
                  <Badge variant="secondary" className="text-xs">Free</Badge>
                </div>
              </SelectItem>
              {BYOK_PROVIDERS.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <span>{p.label}</span>
                    <Badge variant="outline" className="text-xs">Your key</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{selectedConfig.description}</p>
        </div>

        {/* Model picker */}
        <div className="space-y-2">
          <Label>Model</Label>
          <Select value={model} onValueChange={(v: string) => setModel(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* API key field — only for BYOK providers */}
        {provider !== 'app' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{selectedConfig.keyLabel}</Label>
              {selectedConfig.keyLink && (
                <a
                  href={selectedConfig.keyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  Get key <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <Input
              type="password"
              placeholder={`${selectedConfig.keyPrefix}...`}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              autoComplete="off"
            />
            {state.hasKey && !apiKey && (
              <p className="text-xs text-muted-foreground">
                Key saved. Enter a new key to replace it.
              </p>
            )}
          </div>
        )}

        {/* Status message */}
        {message && (
          <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success'
              ? <CheckCircle2 className="h-4 w-4 shrink-0" />
              : <AlertCircle className="h-4 w-4 shrink-0" />
            }
            {message.text}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
          {state.hasKey && provider !== 'app' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleRemoveKey}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {deleting ? 'Removing...' : 'Remove key'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
