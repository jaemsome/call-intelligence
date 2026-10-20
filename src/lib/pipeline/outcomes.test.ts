import { describe, expect, it } from 'vitest'
import { coerceOutcome } from './outcomes'

describe('coerceOutcome', () => {
  it('keeps valid outcomes', () => {
    expect(coerceOutcome('sales', 'booked')).toBe('booked')
    expect(coerceOutcome('retention', 'saved')).toBe('saved')
    expect(coerceOutcome('billing', 'unresolved')).toBe('unresolved')
    expect(coerceOutcome('reservice', 'follow_up')).toBe('follow_up')
  })
  it('falls back to follow_up for mismatches', () => {
    expect(coerceOutcome('sales', 'saved')).toBe('follow_up')
    expect(coerceOutcome('retention', 'booked')).toBe('follow_up')
    expect(coerceOutcome('other_service', 'no_outcome')).toBe('follow_up')
  })
  it('always gives no_outcome for not_scorable', () => {
    expect(coerceOutcome('not_scorable', 'booked')).toBe('no_outcome')
    expect(coerceOutcome('not_scorable', 'no_outcome')).toBe('no_outcome')
  })
})
