import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { RetryButton } from '@/components/calls/RetryButton'
import { CALL_TYPE_LABEL, OUTCOME_LABEL, OUTCOME_TONE } from '@/lib/labels'
import type { CallDetail } from '@/lib/types'
import { formatDateFull, formatDuration } from '@/lib/utils'
import { DeleteCallButton } from './DeleteCallButton'
import { ScoreRing } from './ScoreRing'

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function DetailHeader({ call }: { call: CallDetail }) {
  const direction = call.direction && call.direction !== 'unknown' ? capitalise(call.direction) : null
  const meta = [call.rep?.name ?? 'Unknown rep', direction, formatDuration(call.duration_sec), formatDateFull(call.created_at)].filter(Boolean)
  // Re-analyse only once the pipeline has settled; hidden while the call is processing.
  const canReanalyse = (call.status === 'done' || call.status === 'failed') && call.duration_sec != null
  return (
    <>
      <Link href="/calls/log" className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />All calls
      </Link>
      <Card className="mb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {call.call_type && <Badge>{CALL_TYPE_LABEL[call.call_type]}</Badge>}
              {call.outcome && <Badge tone={OUTCOME_TONE[call.outcome]}>{OUTCOME_LABEL[call.outcome]}</Badge>}
              {call.needs_review && <Badge tone="warn"><AlertTriangle className="size-3" aria-hidden />Needs review</Badge>}
            </div>
            <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">{call.customer_name ?? call.label}</h1>
            <p className="mt-1 text-sm text-ink-3">{[call.customer_name ? call.label : null, ...meta].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            {call.score != null && call.max_score != null && call.grade && <ScoreRing score={call.score} max={call.max_score} grade={call.grade} />}
            <div className="flex flex-wrap gap-1">
              {canReanalyse && <RetryButton callId={call.id} mode="reanalyse" label="Re-analyse" />}
              <DeleteCallButton callId={call.id} label={call.label} />
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}
