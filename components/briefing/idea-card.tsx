'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, scoreBadge } from '@/lib/utils'
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react'

interface IdeaCardProps {
  idea: {
    id:              string
    title:           string
    hook:            string | null
    rationale:       string
    audienceFit:     string | null
    competitorGap:   string | null
    repetitionRisk:  string | null
    validationScore: number | null
    status:          string
  }
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const [status, setStatus]     = useState(idea.status)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading]   = useState(false)

  const score = idea.validationScore ?? 0

  async function act(action: 'accepted' | 'rejected') {
    setLoading(true)
    await fetch(`/api/ideas/${idea.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: action }),
    })
    setStatus(action)
    setLoading(false)
  }

  const repetitionColor: Record<string, string> = {
    new:    'bg-green-50 text-green-700 border-green-200',
    sequel: 'bg-blue-50 text-blue-700 border-blue-200',
    repeat: 'bg-red-50 text-red-700 border-red-200',
  }

  const risk = (idea.repetitionRisk ?? 'new').toLowerCase().split(/[^a-z]/)[0]

  return (
    <Card className={cn(
      'transition-all',
      status === 'accepted'  && 'border-green-300 bg-green-50/30',
      status === 'rejected'  && 'opacity-50',
    )}>
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <p className="font-semibold text-slate-900 leading-snug">{idea.title}</p>
            {idea.hook && <p className="text-sm text-slate-500 mt-1 italic">"{idea.hook}"</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {idea.repetitionRisk && (
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', repetitionColor[risk] ?? repetitionColor.new)}>
                {risk}
              </span>
            )}
            <Badge variant={scoreBadge(score)}>{score}/100</Badge>
          </div>
        </div>

        {/* Rationale */}
        <p className="text-sm text-slate-600 leading-relaxed">{idea.rationale}</p>

        {/* Expandable detail */}
        {expanded && (
          <div className="mt-4 space-y-3 pt-3 border-t">
            {idea.audienceFit && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Audience fit</p>
                <p className="text-sm text-slate-600">{idea.audienceFit}</p>
              </div>
            )}
            {idea.competitorGap && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Competitor gap</p>
                <p className="text-sm text-slate-600">{idea.competitorGap}</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-3 transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Less detail' : 'More detail'}
        </button>
      </CardContent>

      {status === 'suggested' && (
        <CardFooter className="px-5 pb-4 pt-0 gap-2">
          <Button size="sm" onClick={() => act('accepted')} disabled={loading}>
            <ThumbsUp size={14} /> Use this idea
          </Button>
          <Button size="sm" variant="outline" onClick={() => act('rejected')} disabled={loading}>
            <ThumbsDown size={14} /> Skip
          </Button>
        </CardFooter>
      )}

      {status === 'accepted' && (
        <CardFooter className="px-5 pb-4 pt-0">
          <span className="text-xs font-semibold text-green-600">✓ Accepted — go write it</span>
        </CardFooter>
      )}
    </Card>
  )
}
