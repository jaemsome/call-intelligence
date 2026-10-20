import { describe, expect, it } from 'vitest'
import type { CallListItem, Coaching, ResultRow } from '@/lib/types'
import { buildCoachingPlan, buildRepSummaries } from './repSummary'

const call = (over: Partial<CallListItem & { coaching: Coaching | null }>) => ({
  id: 'x', label: 'CALL', status: 'done', error: null, failed_step: null, call_type: 'sales', not_scorable_reason: null, scorecard: 'sales_17',
  direction: 'inbound', customer_name: null, outcome: 'booked', summary: null, duration_sec: 60, score: 14, max_score: 17, grade: 'green',
  needs_review: false, created_at: '2026-10-18T10:00:00Z', details: null, rep: { id: 'r1', name: 'Michelle' }, coaching: null, ...over,
}) as CallListItem & { coaching: Coaching | null }

const calls = [
  call({ id: 'a', score: 17, grade: 'gold' }),
  call({ id: 'b', score: 11, grade: 'below', coaching: { strengths: [], fixes: [{ item_key: 'summary', what_happened: 'x', say_instead: 'So it sounds like…', line: 3 }], missed_opportunities: [] } }),
  call({ id: 'c', rep: { id: 'r2', name: 'Kris' }, score: 12, max_score: 12, scorecard: 'all_calls_12', call_type: 'billing', grade: 'gold' }),
]
const results: ResultRow[] = [
  { call_id: 'a', item_key: 'summary', status: 'hit' }, { call_id: 'b', item_key: 'summary', status: 'miss' },
  { call_id: 'a', item_key: 'close', status: 'miss' }, { call_id: 'b', item_key: 'close', status: 'miss' },
]

describe('buildRepSummaries', () => {
  it('groups by rep with averages, grade mix and top missed step', () => {
    const [kris, michelle] = buildRepSummaries(calls, results)
    expect(kris.rep.name).toBe('Kris')
    expect(michelle).toMatchObject({ calls: 2, scored: 2, avgPct: 82, grades: { gold: 1, green: 0, below: 1 } })
    expect(michelle.topMissed).toMatchObject({ key: 'close', missed: 2, total: 2 })
  })

  it('ignores calls without a rep or not done', () => {
    const out = buildRepSummaries([call({ id: 'n', rep: null }), call({ id: 'p', status: 'transcribing' })], [])
    expect(out).toEqual([])
  })
})

describe('buildCoachingPlan', () => {
  it('lists top missed steps with example calls and a script', () => {
    const plan = buildCoachingPlan(calls.filter((c) => c.rep?.id === 'r1'), results)
    expect(plan[0]).toMatchObject({ key: 'close', examples: [{ id: 'a' }, { id: 'b' }] })
    expect(plan.find((p) => p.key === 'summary')).toMatchObject({ sayInstead: 'So it sounds like…' })
  })
})

describe('edge cases', () => {
  const fix = (key: string, say: string): Coaching => ({ strengths: [], fixes: [{ item_key: key, what_happened: 'x', say_instead: say, line: 1 }], missed_opportunities: [] })

  it('sorts an unscored rep last and ties by name', () => {
    const list = [
      call({ id: 'u', rep: { id: 'r3', name: 'Zed' }, score: null, max_score: null, grade: null }),
      call({ id: 'k', rep: { id: 'r2', name: 'Kris' } }),
      call({ id: 'm', rep: { id: 'r1', name: 'Michelle' } }),
    ]
    expect(buildRepSummaries(list, []).map((r) => r.rep.name)).toEqual(['Kris', 'Michelle', 'Zed'])
  })

  it('does not count a done call with null score in grades or average', () => {
    const [r] = buildRepSummaries([call({ id: 'a', score: 17, grade: 'gold' }), call({ id: 'n', score: null, max_score: null, grade: null })], [])
    expect(r).toMatchObject({ calls: 2, scored: 1, avgPct: 100, grades: { gold: 1, green: 0, below: 0 } })
  })

  it('gives a 1-call rep no top missed step and an empty plan', () => {
    const one = [call({ id: 'a' })]
    const res: ResultRow[] = [{ call_id: 'a', item_key: 'close', status: 'miss' }]
    expect(buildRepSummaries(one, res)[0].topMissed).toBeNull()
    expect(buildCoachingPlan(one, res)).toEqual([])
  })

  it('keeps examples and scripts to the step\'s own scorecard', () => {
    const list = [
      call({ id: 's1', coaching: fix('close', 'sales script') }),
      call({ id: 's2' }),
      call({ id: 'b1', scorecard: 'all_calls_12', call_type: 'billing', coaching: fix('close', 'billing script') }),
      call({ id: 'b2', scorecard: 'all_calls_12', call_type: 'billing' }),
    ]
    const res: ResultRow[] = list.map((c) => ({ call_id: c.id, item_key: 'close', status: 'miss' as const }))
    const plan = buildCoachingPlan(list, res)
    const sales = plan.find((p) => p.scorecard === 'sales_17')
    const billing = plan.find((p) => p.scorecard === 'all_calls_12')
    expect(sales?.examples.map((e) => e.id)).toEqual(['s1', 's2'])
    expect(sales?.sayInstead).toBe('sales script')
    expect(billing?.examples.map((e) => e.id)).toEqual(['b1', 'b2'])
    expect(billing?.sayInstead).toBe('billing script')
  })
})
