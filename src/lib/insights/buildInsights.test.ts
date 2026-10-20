import { describe, expect, it } from 'vitest'
import type { CallListItem, ResultRow } from '@/lib/types'
import { buildInsights } from './buildInsights'

const call = (over: Partial<CallListItem>): CallListItem => ({
  id: 'x', label: 'CALL 001', status: 'done', error: null, failed_step: null, call_type: 'sales', not_scorable_reason: null,
  scorecard: 'sales_17', direction: 'inbound', customer_name: 'Pat Customer', outcome: 'booked', summary: 'Ants in kitchen',
  duration_sec: 300, score: 15, max_score: 17, grade: 'green', needs_review: false, created_at: '2026-10-18T10:00:00Z',
  details: null, rep: { id: 'r1', name: 'Michelle' }, ...over,
})

const calls = [
  call({ id: 's1', outcome: 'booked', score: 17, max_score: 17 }),
  call({ id: 's2', outcome: 'not_booked', score: 10, max_score: 17, needs_review: true }),
  call({ id: 's3', outcome: 'follow_up', score: 12, max_score: 17 }),
  call({ id: 'r1', call_type: 'retention', scorecard: 'retention_12', outcome: 'saved', score: 12, max_score: 12, details: { pests: [], price_quoted: null, appointment: null, cancel_reason: 'Still seeing ants', save_offer: 'Free re-service', objections: [], next_step: null, retention_exempt: false, confidence: 'high' } }),
  call({ id: 'r2', call_type: 'retention', scorecard: 'retention_12', outcome: 'cancelled', score: 6, max_score: 12, details: { pests: [], price_quoted: null, appointment: null, cancel_reason: 'Too expensive', save_offer: null, objections: [], next_step: null, retention_exempt: false, confidence: 'high' } }),
  call({ id: 'n1', call_type: 'not_scorable', scorecard: null, outcome: 'no_outcome', score: null, max_score: null, grade: null }),
  call({ id: 'p1', status: 'scoring', score: null, max_score: null, grade: null }),
]
const results: ResultRow[] = [
  { call_id: 's1', item_key: 'close', status: 'hit' }, { call_id: 's2', item_key: 'close', status: 'miss' }, { call_id: 's3', item_key: 'close', status: 'miss' },
  { call_id: 's1', item_key: 'summary', status: 'miss' }, { call_id: 's2', item_key: 'summary', status: 'miss' }, { call_id: 's3', item_key: 'summary', status: 'miss' },
  { call_id: 'r2', item_key: 'present_solution', status: 'miss' }, { call_id: 'r1', item_key: 'present_solution', status: 'hit' },
]

describe('buildInsights', () => {
  const ins = buildInsights(calls, results)
  it('computes KPIs from finished calls only', () => {
    expect(ins.kpis).toMatchObject({ analysed: 6, scored: 5, salesCount: 3, salesBooked: 1, salesCloseRate: 33, retentionCount: 2, retentionSaved: 1, retentionDecided: 2, saveRate: 50, needsReview: 1 })
    expect(ins.kpis.avgPct).toBe(Math.round(((17 / 17 + 10 / 17 + 12 / 17 + 1 + 0.5) / 5) * 100))
  })
  it('raises leaks with counts and deep links', () => {
    const ids = ins.leaks.map((l) => l.id)
    expect(ids).toEqual(expect.arrayContaining(['sales_no_close', 'sales_open', 'retention_no_offer', 'most_missed', 'needs_review']))
    expect(ins.leaks.find((l) => l.id === 'sales_no_close')).toMatchObject({ count: 2, href: '/calls/log?type=sales&missed=close&scorecard=sales_17' })
    expect(ins.leaks.find((l) => l.id === 'most_missed')).toMatchObject({ href: '/calls/log?missed=summary&scorecard=sales_17' })
    expect(ins.leaks.find((l) => l.id === 'retention_no_offer')).toMatchObject({ count: 1, href: '/calls/log?type=retention&outcome=cancelled&missed=present_solution' })
  })
  it('lists bad leaks first and skips the duplicate close leak', () => {
    expect(ins.leaks[0].tone).toBe('bad')
    const tones = ins.leaks.map((l) => l.tone)
    expect(tones.indexOf('warn')).toBeGreaterThan(tones.lastIndexOf('bad'))
    const onlyClose = buildInsights(calls.filter((c) => c.call_type === 'sales'), results.filter((r) => r.item_key === 'close'))
    expect(onlyClose.leaks.find((l) => l.id === 'most_missed')).toBeUndefined()
  })
  it('ranks most-missed steps', () => {
    expect(ins.missedSteps[0]).toMatchObject({ key: 'summary', missed: 3, total: 3 })
  })
  it('lists retention reasons with outcomes', () => {
    expect(ins.retention).toEqual([
      { callId: 'r1', reason: 'Still seeing ants', outcome: 'saved' },
      { callId: 'r2', reason: 'Too expensive', outcome: 'cancelled' },
    ])
  })
  it('counts the call type mix', () => {
    expect(ins.typeMix).toEqual([{ type: 'sales', count: 3 }, { type: 'retention', count: 2 }, { type: 'not_scorable', count: 1 }])
  })
})
