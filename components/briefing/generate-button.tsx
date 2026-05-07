'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Zap } from 'lucide-react'

export function GenerateBriefingButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const router = useRouter()

  async function generate() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/briefing', { method: 'POST' })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Unknown error' }))
      setError(data.error ?? 'Generation failed. Please try again.')
      setLoading(false)
      return
    }

    // Refresh server components to show the new briefing
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <Button onClick={generate} disabled={loading} className="gap-2">
        {loading
          ? <><Loader2 size={15} className="animate-spin" /> Analysing your memory…</>
          : <><Zap size={15} /> Generate today's briefing</>
        }
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
