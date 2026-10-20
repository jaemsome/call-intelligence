import { describe, expect, it } from 'vitest'
import { matchRep, normalizeName } from './reps'

const reps = [
  { id: 'a', name: 'Michelle Rivera', aliases: ['Shelly'] },
  { id: 'b', name: 'Kris Tester', aliases: [] },
]

describe('normalizeName', () => {
  it('lowercases and strips non-letters', () => expect(normalizeName('  Michelle  S. ')).toBe('michelle s'))
})

describe('matchRep', () => {
  it('matches the full name', () => expect(matchRep('michelle rivera', reps)?.id).toBe('a'))
  it('matches an alias', () => expect(matchRep('Shelly', reps)?.id).toBe('a'))
  it('matches a unique first name', () => expect(matchRep('Kris', reps)?.id).toBe('b'))
  it('does not guess when the first name is ambiguous', () => {
    expect(matchRep('Michelle', [...reps, { id: 'c', name: 'Michelle Park', aliases: [] }])).toBeNull()
  })
  it('returns null for unknown or empty names', () => {
    expect(matchRep('Dave', reps)).toBeNull()
    expect(matchRep('', reps)).toBeNull()
  })
  it('does not first-name match a multi-word spoken name', () => {
    expect(matchRep('Michelle Smith', [{ id: '1', name: 'Michelle Jones', aliases: [] }])).toBeNull()
  })
  it('returns null when an exact name/alias matches several reps', () => {
    const two = [{ id: '1', name: 'A One', aliases: ['Sam'] }, { id: '2', name: 'B Two', aliases: ['Sam'] }]
    expect(matchRep('Sam', two)).toBeNull()
  })
  it('strips diacritics', () => {
    expect(matchRep('José', [{ id: '1', name: 'Jose Ruiz', aliases: [] }])?.id).toBe('1')
    expect(normalizeName('José')).toBe('jose')
  })
})
