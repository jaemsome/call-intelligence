import { describe, expect, it } from 'vitest'
import { nextStep, canStart, hasTimeFor, STEP_BUDGET_MS, isStuck, isAbandoned, ABANDONED_MS } from './nextStep'

const base = { status: 'uploaded' as const, failed_step: null, scorecard: null, status_at: '2026-10-18T10:00:00Z', duration_sec: null }
const now = new Date('2026-10-18T10:03:00Z')

describe('nextStep', () => {
  it('walks the steps in order', () => {
    expect(nextStep({ ...base, status: 'uploaded' })).toBe('transcribe')
    expect(nextStep({ ...base, status: 'transcribed' })).toBe('classify')
    expect(nextStep({ ...base, status: 'classified', scorecard: 'sales_17' })).toBe('score')
  })
  it('stops when classified as not scorable', () => expect(nextStep({ ...base, status: 'classified' })).toBeNull())
  it('resumes a failed call at the failed step', () => expect(nextStep({ ...base, status: 'failed', failed_step: 'score' })).toBe('score'))
  it('maps in-progress statuses to their own step', () => {
    expect(nextStep({ ...base, status: 'classifying' })).toBe('classify')
    expect(nextStep({ ...base, status: 'scoring', scorecard: 'sales_17' })).toBe('score')
  })
  it('restarts from transcribe when failed without a step', () => expect(nextStep({ ...base, status: 'failed', failed_step: null })).toBe('transcribe'))
  it('does nothing when done', () => expect(nextStep({ ...base, status: 'done' })).toBeNull())
})

describe('canStart', () => {
  it('starts uploaded or failed calls', () => {
    expect(canStart({ ...base, status: 'uploaded' }, 'start', now)).toBe(true)
    expect(canStart({ ...base, status: 'failed', failed_step: 'classify' }, 'start', now)).toBe(true)
  })
  it('continues a paused run from a resting status', () => {
    expect(canStart({ ...base, status: 'transcribed' }, 'start', now)).toBe(true)
    expect(canStart({ ...base, status: 'classified', scorecard: 'sales_17' }, 'start', now)).toBe(true)
  })
  it('refuses a call that is actively processing', () => expect(canStart({ ...base, status: 'scoring' }, 'start', now)).toBe(false))
  it('rescues a run stuck for more than 6 minutes', () => {
    expect(canStart({ ...base, status: 'scoring', status_at: '2026-10-18T09:50:00Z' }, 'start', now)).toBe(true)
  })
  it('treats exactly 6 minutes as not stuck, and 6m1s as stuck', () => {
    expect(canStart({ ...base, status: 'scoring', status_at: '2026-10-18T09:57:00Z' }, 'start', now)).toBe(false)
    expect(canStart({ ...base, status: 'scoring', status_at: '2026-10-18T09:56:59Z' }, 'start', now)).toBe(true)
  })
  it('does not start a done call in start mode', () => expect(canStart({ ...base, status: 'done', duration_sec: 120 }, 'start', now)).toBe(false))
  it('refuses to re-analyse failed calls without a transcript', () => {
    expect(canStart({ ...base, status: 'failed', failed_step: 'classify', duration_sec: null }, 'reanalyse', now)).toBe(false)
    expect(canStart({ ...base, status: 'failed', failed_step: 'transcribe', duration_sec: 120 }, 'reanalyse', now)).toBe(false)
    expect(canStart({ ...base, status: 'failed', failed_step: 'score', duration_sec: 120 }, 'reanalyse', now)).toBe(true)
  })
  it('re-analyses finished calls that have a transcript', () => {
    expect(canStart({ ...base, status: 'done', duration_sec: 120 }, 'reanalyse', now)).toBe(true)
    expect(canStart({ ...base, status: 'uploaded' }, 'reanalyse', now)).toBe(false)
  })
})

describe('hasTimeFor', () => {
  it('always has time without a deadline', () => expect(hasTimeFor(1_000, undefined, 150_000)).toBe(true))
  it('has time exactly at the boundary', () => expect(hasTimeFor(250_000, 400_000, 150_000)).toBe(true))
  it('has no time inside the budget', () => expect(hasTimeFor(250_001, 400_000, 150_000)).toBe(false))
  it('has no time after the deadline', () => expect(hasTimeFor(500_000, 400_000, 130_000)).toBe(false))
  it('has per-step budgets', () => expect(STEP_BUDGET_MS).toEqual({ transcribe: 130_000, classify: 150_000, score: 180_000 }))
})

describe('isStuck', () => {
  const at = Date.parse('2026-10-18T10:00:00Z')
  it('is true for a running status older than 6 minutes', () => {
    expect(isStuck('scoring', '2026-10-18T10:00:00Z', at + 6 * 60_000 + 1)).toBe(true)
    expect(isStuck('transcribing', '2026-10-18T10:00:00Z', at + 6 * 60_000)).toBe(false)
  })
  it('is false for non-running statuses and missing timestamps', () => {
    expect(isStuck('transcribed', '2026-10-18T10:00:00Z', at + 3_600_000)).toBe(false)
    expect(isStuck('classifying', undefined, at + 3_600_000)).toBe(false)
    expect(isStuck('classifying', 'garbage', at + 3_600_000)).toBe(false)
  })
})

describe('isAbandoned', () => {
  const at = Date.parse('2026-10-18T10:00:00Z')
  it('is true for uploaded older than 15 minutes', () => {
    expect(isAbandoned('uploaded', '2026-10-18T10:00:00Z', at + ABANDONED_MS + 1)).toBe(true)
    expect(isAbandoned('uploaded', '2026-10-18T10:00:00Z', at + ABANDONED_MS)).toBe(false)
  })
  it('is false for other statuses or bad timestamps', () => {
    expect(isAbandoned('transcribing', '2026-10-18T10:00:00Z', at + 3_600_000)).toBe(false)
    expect(isAbandoned('uploaded', undefined, at + 3_600_000)).toBe(false)
    expect(isAbandoned('uploaded', 'garbage', at + 3_600_000)).toBe(false)
  })
})
