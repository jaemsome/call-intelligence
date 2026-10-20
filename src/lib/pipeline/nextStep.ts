import type { CallStatus, PipelineStep, ScorecardKind } from '@/lib/types'

export type PipelineState = { status: CallStatus; failed_step: PipelineStep | null; scorecard: ScorecardKind | null; status_at: string; duration_sec: number | null }
export type StartMode = 'start' | 'reanalyse'

export const RUNNING: Record<PipelineStep, CallStatus> = { transcribe: 'transcribing', classify: 'classifying', score: 'scoring' }
export const STUCK_MS = 6 * 60 * 1000
export const ABANDONED_MS = 15 * 60 * 1000
/** Time each step may need; below this we pause instead of risking a function timeout (overruns are rescued by isStuck). */
export const STEP_BUDGET_MS: Record<PipelineStep, number> = { transcribe: 130_000, classify: 150_000, score: 180_000 }

export function nextStep(call: Pick<PipelineState, 'status' | 'failed_step' | 'scorecard'>): PipelineStep | null {
  switch (call.status) {
    case 'uploaded':
    case 'transcribing':
      return 'transcribe'
    case 'transcribed':
    case 'classifying':
      return 'classify'
    case 'classified':
    case 'scoring':
      return call.scorecard ? 'score' : null
    case 'failed':
      return call.failed_step ?? 'transcribe'
    default:
      return null
  }
}

/** True when a call sits in a running status for longer than STUCK_MS (its function likely died). */
export function isStuck(status: CallStatus, statusAt: string | null | undefined, now: number): boolean {
  if (!statusAt || !Object.values(RUNNING).includes(status)) return false
  const t = new Date(statusAt).getTime()
  return Number.isFinite(t) && now - t > STUCK_MS
}

/** True when an upload never finished: still 'uploaded' for longer than ABANDONED_MS. */
export function isAbandoned(status: CallStatus, statusAt: string | null | undefined, now: number): boolean {
  if (!statusAt || status !== 'uploaded') return false
  const t = new Date(statusAt).getTime()
  return Number.isFinite(t) && now - t > ABANDONED_MS
}

export function canStart(call: PipelineState, mode: StartMode, now: Date): boolean {
  if (mode === 'reanalyse') {
    if (call.duration_sec == null) return false
    return call.status === 'done' || (call.status === 'failed' && call.failed_step !== 'transcribe')
  }
  if (['uploaded', 'failed', 'transcribed', 'classified'].includes(call.status)) return true
  const running = Object.values(RUNNING).includes(call.status)
  return running && isStuck(call.status, call.status_at, now.getTime())
}

/** True when another step can safely begin before the deadline (no deadline = unlimited). */
export function hasTimeFor(now: number, deadlineAt: number | undefined, budgetMs: number): boolean {
  return deadlineAt === undefined || now <= deadlineAt - budgetMs
}
