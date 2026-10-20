'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { RetryButton } from '@/components/calls/RetryButton'
import { ProcessingSteps } from '@/components/calls/ProcessingSteps'
import { AudioPlayer } from '@/components/detail/AudioPlayer'
import { CoachingPanel } from '@/components/detail/CoachingPanel'
import { DeleteCallButton } from '@/components/detail/DeleteCallButton'
import { DetailHeader } from '@/components/detail/DetailHeader'
import { DetailTabs, panelId, tabId, type Tab } from '@/components/detail/DetailTabs'
import { ScorecardPanel } from '@/components/detail/ScorecardPanel'
import { SeekProvider, useSeekActions } from '@/components/detail/SeekContext'
import { SummaryPanel } from '@/components/detail/SummaryPanel'
import { TranscriptPanel } from '@/components/detail/TranscriptPanel'
import { useCallStatus } from '@/hooks/useCallStatus'
import { isProcessing } from '@/lib/labels'
import { isAbandoned, isStuck } from '@/lib/pipeline/nextStep'
import type { CallDetail } from '@/lib/types'
import { cn } from '@/lib/utils'

function Body({ call }: { call: CallDetail }) {
  const router = useRouter()
  const { focusLine } = useSeekActions()
  const [tab, setTab] = useState<Tab>('summary')
  const [pendingLine, setPendingLine] = useState<{ idx: number } | null>(null)
  const live = useCallStatus(isProcessing(call.status) ? [call.id] : [], () => router.refresh())
  const status = live[call.id]?.status ?? call.status
  const processing = isProcessing(status)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  const statusAt = live[call.id]?.status_at ?? call.status_at
  const abandoned = isAbandoned(status, statusAt, now)
  const stuck = abandoned || isStuck(status, statusAt, now)

  const goToLine = (idx: number) => {
    setPendingLine({ idx }) // new object each time so repeat clicks re-trigger
    setTab('transcript')
  }
  useEffect(() => {
    if (!pendingLine || tab !== 'transcript') return
    const { idx } = pendingLine
    const seg = call.segments.find((s) => s.idx === idx)
    // Two frames so the transcript panel is laid out (visible) before scrolling.
    let r2 = 0
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => { focusLine(idx, seg?.start_ms); setPendingLine(null) })
    })
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2) }
  }, [tab, pendingLine, call.segments, focusLine])

  const panel = (t: Tab) => cn(tab !== t && 'hidden', 'lg:block')
  const aria = (t: Tab) => ({ id: panelId(t), role: 'tabpanel' as const, 'aria-labelledby': tabId(t) })
  const showAnalysis = !processing && status !== 'failed'
  const unavailable = processing ? 'Analysing this call…'
    : status === 'failed' ? 'Scorecard unavailable — processing failed.'
    : call.call_type === 'not_scorable' ? `Not scored: ${call.not_scorable_reason ?? 'not a scorable conversation'}`
    : 'No scorecard results yet.'

  return (
    <>
      <DetailHeader call={call} />
      {processing && <Card className="mb-4"><p className="mb-4 font-medium">Analysing this call…</p><ProcessingSteps status={status} /></Card>}
      {processing && stuck && (
        <Card className="mb-4">
          <p className="font-medium">{abandoned ? "This upload didn't finish." : 'This is taking longer than expected.'}</p>
          <p className="mt-1 mb-4 text-sm text-ink-2">{abandoned ? 'Delete this call and upload the recording again.' : 'The run may have been interrupted. You can restart it from where it stopped.'}</p>
          {abandoned ? <DeleteCallButton callId={call.id} label={call.label} /> : <RetryButton callId={call.id} mode="start" />}
        </Card>
      )}
      {status === 'failed' && (
        <Card className="mb-4">
          <p className="font-medium text-bad">Processing failed{call.failed_step ? ` at “${call.failed_step}”` : ''}.</p>
          <p className="mt-1 mb-4 text-sm text-ink-2">{live[call.id]?.error ?? call.error}</p>
          <RetryButton callId={call.id} />
        </Card>
      )}
      {call.duration_sec != null && <AudioPlayer key={call.id} callId={call.id} durationSec={call.duration_sec} />}

      <DetailTabs tab={tab} onChange={setTab} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div {...aria('transcript')} className={panel('transcript')}>
          <TranscriptPanel segments={call.segments} results={call.results} scorecard={call.scorecard} repName={call.rep?.name ?? null} />
        </div>
        <div className="flex flex-col gap-4">
          <div {...aria('summary')} className={panel('summary')}>
            <div className="flex flex-col gap-4">
              <SummaryPanel call={call} />
              {showAnalysis && call.coaching && call.scorecard && (
                <CoachingPanel coaching={call.coaching} scorecard={call.scorecard} onLine={goToLine} />
              )}
            </div>
          </div>
          <div {...aria('scorecard')} className={panel('scorecard')}>
            {showAnalysis && call.scorecard && call.results.length > 0 ? (
              <ScorecardPanel kind={call.scorecard} results={call.results} score={call.score} maxScore={call.max_score} onLine={goToLine} />
            ) : (
              <Card><p className="text-sm text-ink-2">{unavailable}</p></Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export function CallDetailView({ call }: { call: CallDetail }) {
  return <SeekProvider><Body call={call} /></SeekProvider>
}
