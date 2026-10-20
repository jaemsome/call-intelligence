import { describe, expect, it } from 'vitest'
import { getScorecard, scorecardForCallType, SCORECARDS } from './index'

describe('scorecards', () => {
  it('sales has 17 unique items and Gold 17 / Green 14', () => {
    const s = getScorecard('sales_17')
    expect(s.items).toHaveLength(17)
    expect(new Set(s.items.map((i) => i.key)).size).toBe(17)
    expect(s.maxScore).toBe(17)
    expect(s.thresholds).toEqual({ gold: 17, green: 14 })
  })
  it('all-calls and retention have 12 items, Gold 12 / Green 11', () => {
    for (const kind of ['all_calls_12', 'retention_12'] as const) {
      const s = getScorecard(kind)
      expect(s.items).toHaveLength(12)
      expect(new Set(s.items.map((i) => i.key)).size).toBe(12)
      expect(s.thresholds).toEqual({ gold: 12, green: 11 })
    }
  })
  it('maps call types to the right scorecard', () => {
    expect(scorecardForCallType('sales')).toBe('sales_17')
    expect(scorecardForCallType('retention')).toBe('retention_12')
    for (const t of ['reservice', 'scheduling', 'billing', 'other_service'] as const) expect(scorecardForCallType(t)).toBe('all_calls_12')
    expect(scorecardForCallType('not_scorable')).toBeNull()
  })
  it('only the four sales objection items use the no_objections rule', () => {
    const keys = SCORECARDS.sales_17.items.filter((i) => i.naRule === 'no_objections').map((i) => i.key)
    expect(keys).toEqual(['obj_agree', 'obj_restate', 'obj_resolve', 'obj_reclose'])
  })
  it('every item has a definition and at least one example', () => {
    for (const s of Object.values(SCORECARDS)) for (const i of s.items) {
      expect(i.definition.length).toBeGreaterThan(10)
      expect(i.examples.length).toBeGreaterThan(0)
    }
  })
})
