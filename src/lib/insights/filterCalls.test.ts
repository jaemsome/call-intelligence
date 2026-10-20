import { describe, expect, it } from 'vitest'
import type { CallListItem, ResultRow } from '@/lib/types'
import { filterCalls, parseFilters } from './filterCalls'

const call = (over: Partial<CallListItem>): CallListItem => ({
  id: 'x', label: 'CALL 001', status: 'done', error: null, failed_step: null, call_type: 'sales', not_scorable_reason: null,
  scorecard: 'sales_17', direction: 'inbound', customer_name: 'Pat Customer', outcome: 'booked', summary: 'Ants in kitchen',
  duration_sec: 300, score: 15, max_score: 17, grade: 'green', needs_review: false, created_at: '2026-10-18T10:00:00Z',
  details: null, rep: { id: 'r1', name: 'Michelle' }, ...over,
})

const calls = [
  call({ id: 'a', call_type: 'sales', outcome: 'booked', grade: 'gold' }),
  call({ id: 'b', call_type: 'sales', outcome: 'not_booked', grade: 'below', needs_review: true }),
  call({ id: 'c', call_type: 'retention', scorecard: 'retention_12', outcome: 'cancelled', customer_name: 'Sam Example', rep: { id: 'r2', name: 'Kris' } }),
]
const results: ResultRow[] = [{ call_id: 'b', item_key: 'close', status: 'miss' }, { call_id: 'a', item_key: 'close', status: 'hit' }]

describe('parseFilters', () => {
  it('keeps only valid values', () => {
    expect(parseFilters({ type: 'sales', grade: 'nope', review: '1', q: '  ants ', missed: 'close' }))
      .toEqual({ type: 'sales', review: true, q: 'ants', missed: 'close' })
  })
  it('ignores arrays and oversized search', () => {
    expect(parseFilters({ type: ['sales', 'billing'], q: 'x'.repeat(200) })).toEqual({ q: 'x'.repeat(100) })
  })
})

describe('scorecard filter', () => {
  it('parses only known scorecards', () => {
    expect(parseFilters({ scorecard: 'sales_17' })).toEqual({ scorecard: 'sales_17' })
    expect(parseFilters({ scorecard: 'bogus' })).toEqual({})
  })
  it('scopes calls by scorecard', () => expect(filterCalls(calls, results, { scorecard: 'retention_12' }).map((c) => c.id)).toEqual(['c']))
})

describe('filterCalls', () => {
  it('filters by type', () => expect(filterCalls(calls, results, { type: 'sales' }).map((c) => c.id)).toEqual(['a', 'b']))
  it('filters by missed scorecard item', () => expect(filterCalls(calls, results, { missed: 'close' }).map((c) => c.id)).toEqual(['b']))
  it('open outcome means not booked or follow-up', () => expect(filterCalls(calls, results, { outcome: 'open' }).map((c) => c.id)).toEqual(['b']))
  it('filters by needs review', () => expect(filterCalls(calls, results, { review: true }).map((c) => c.id)).toEqual(['b']))
  it('filters by rep', () => expect(filterCalls(calls, results, { rep: 'r2' }).map((c) => c.id)).toEqual(['c']))
  it('searches customer, label, rep and summary', () => expect(filterCalls(calls, results, { q: 'example' }).map((c) => c.id)).toEqual(['c']))
})
