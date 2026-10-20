import { describe, expect, it } from 'vitest'
import { finalizeScore, gradeFor, type RawItem, type FinalizeContext } from './finalize'
import { getScorecard } from '@/lib/scorecards'

const segs = [{ idx: 0, text: 'I can definitely help you with that today.' }]
const QUOTE = 'I can definitely help you with that today.'
const ctx = (over: Partial<FinalizeContext> = {}): FinalizeContext => ({
  callType: 'sales', outcome: 'booked', objectionsRaised: false, retentionExempt: false, solutionHasCost: true, lowConfidence: false, ...over,
})
const allHits = (kind: 'sales_17' | 'all_calls_12' | 'retention_12'): RawItem[] =>
  getScorecard(kind).items.map((i) => ({ key: i.key, status: 'hit', line: 0, quote: QUOTE, note: '' }))
const withStatus = (items: RawItem[], keys: string[], status: RawItem['status']) =>
  items.map((i) => (keys.includes(i.key) ? { ...i, status, quote: status === 'hit' ? i.quote : null } : i))

describe('gradeFor', () => {
  const sales = getScorecard('sales_17')
  const all = getScorecard('all_calls_12')
  it('sales: 17 gold, 14 green, 13 below', () => {
    expect(gradeFor(17, sales)).toBe('gold')
    expect(gradeFor(14, sales)).toBe('green')
    expect(gradeFor(13, sales)).toBe('below')
  })
  it('12-point: 12 gold, 11 green, 10 below', () => {
    expect(gradeFor(12, all)).toBe('gold')
    expect(gradeFor(11, all)).toBe('green')
    expect(gradeFor(10, all)).toBe('below')
  })
})

describe('finalizeScore', () => {
  it('scores a perfect, verified sales call as 17/17 gold', () => {
    const r = finalizeScore({ scorecard: getScorecard('sales_17'), items: allHits('sales_17'), segments: segs, ctx: ctx({ objectionsRaised: true }) })
    expect(r).toMatchObject({ score: 17, maxScore: 17, grade: 'gold', needsReview: false })
  })
  it('auto-credits all 4 objection items when no objections were raised, even if the model said miss', () => {
    const items = withStatus(allHits('sales_17'), ['obj_agree', 'obj_restate', 'obj_resolve', 'obj_reclose'], 'miss')
    const r = finalizeScore({ scorecard: getScorecard('sales_17'), items, segments: segs, ctx: ctx() })
    expect(r.score).toBe(17)
    expect(r.items.filter((i) => i.status === 'na')).toHaveLength(4)
  })
  it('turns a disallowed N/A into a miss and flags review', () => {
    const items = withStatus(allHits('sales_17'), ['obj_agree'], 'na')
    const r = finalizeScore({ scorecard: getScorecard('sales_17'), items, segments: segs, ctx: ctx({ objectionsRaised: true }) })
    expect(r.items.find((i) => i.item_key === 'obj_agree')?.status).toBe('miss')
    expect(r.score).toBe(16)
    expect(r.needsReview).toBe(true)
  })
  it('allows N/A on Understand items for scheduling calls only', () => {
    const items = withStatus(allHits('all_calls_12'), ['investigate', 'summary', 'expectation_2'], 'na')
    const sched = finalizeScore({ scorecard: getScorecard('all_calls_12'), items, segments: segs, ctx: ctx({ callType: 'scheduling' }) })
    expect(sched.score).toBe(12)
    const reservice = finalizeScore({ scorecard: getScorecard('all_calls_12'), items, segments: segs, ctx: ctx({ callType: 'reservice' }) })
    expect(reservice.score).toBe(9)
  })
  it('lets Consensus double as Close on a no-cost all-calls solution', () => {
    const items = withStatus(allHits('all_calls_12'), ['close'], 'miss')
    const r = finalizeScore({ scorecard: getScorecard('all_calls_12'), items, segments: segs, ctx: ctx({ callType: 'reservice', solutionHasCost: false }) })
    const close = r.items.find((i) => i.item_key === 'close')
    expect(close).toMatchObject({ status: 'hit', quote: QUOTE })
    expect(r.score).toBe(12)
  })
  it('keeps a miss on Close when the solution had a cost', () => {
    const items = withStatus(allHits('all_calls_12'), ['close'], 'miss')
    const r = finalizeScore({ scorecard: getScorecard('all_calls_12'), items, segments: segs, ctx: ctx({ callType: 'billing', solutionHasCost: true }) })
    expect(r.score).toBe(11)
  })
  it('allows retention Teaser N/A only when the customer was saved', () => {
    const items = withStatus(allHits('retention_12'), ['teaser'], 'na')
    const saved = finalizeScore({ scorecard: getScorecard('retention_12'), items, segments: segs, ctx: ctx({ callType: 'retention', outcome: 'saved' }) })
    expect(saved.score).toBe(12)
    const lost = finalizeScore({ scorecard: getScorecard('retention_12'), items, segments: segs, ctx: ctx({ callType: 'retention', outcome: 'cancelled' }) })
    expect(lost.score).toBe(11)
  })
  it('counts but flags a hit whose quote cannot be found', () => {
    const items = allHits('all_calls_12').map((i) => (i.key === 'thank' ? { ...i, quote: 'Thanks so much for being a loyal customer!' } : i))
    const r = finalizeScore({ scorecard: getScorecard('all_calls_12'), items, segments: segs, ctx: ctx({ callType: 'reservice' }) })
    expect(r.items.find((i) => i.item_key === 'thank')).toMatchObject({ status: 'hit', verified: false })
    expect(r.score).toBe(12)
    expect(r.needsReview).toBe(true)
  })
  it('treats items the model skipped as misses and flags review', () => {
    const items = allHits('all_calls_12').filter((i) => i.key !== 'thank')
    const r = finalizeScore({ scorecard: getScorecard('all_calls_12'), items, segments: segs, ctx: ctx({ callType: 'reservice' }) })
    expect(r.score).toBe(11)
    expect(r.needsReview).toBe(true)
  })
  it('flags review when classification confidence was low', () => {
    const r = finalizeScore({ scorecard: getScorecard('all_calls_12'), items: allHits('all_calls_12'), segments: segs, ctx: ctx({ callType: 'reservice', lowConfidence: true }) })
    expect(r.needsReview).toBe(true)
  })
  it('keeps the worst status for duplicate keys and flags review', () => {
    const items = [...allHits('all_calls_12'), { key: 'validate', status: 'miss' as const, line: null, quote: null, note: '' }]
    const r = finalizeScore({ scorecard: getScorecard('all_calls_12'), items, segments: segs, ctx: ctx({ callType: 'reservice' }) })
    expect(r.items.find((i) => i.item_key === 'validate')?.status).toBe('miss')
    expect(r.needsReview).toBe(true)
    const reversed = [{ key: 'validate', status: 'miss' as const, line: null, quote: null, note: '' }, ...allHits('all_calls_12')]
    expect(finalizeScore({ scorecard: getScorecard('all_calls_12'), items: reversed, segments: segs, ctx: ctx({ callType: 'reservice' }) }).items.find((i) => i.item_key === 'validate')?.status).toBe('miss')
  })
  it('ignores unknown keys but flags review', () => {
    const items = [...allHits('all_calls_12'), { key: 'foo', status: 'hit' as const, line: 0, quote: QUOTE, note: '' }]
    const r = finalizeScore({ scorecard: getScorecard('all_calls_12'), items, segments: segs, ctx: ctx({ callType: 'reservice' }) })
    expect(r.score).toBe(12)
    expect(r.items).toHaveLength(12)
    expect(r.needsReview).toBe(true)
  })
})
