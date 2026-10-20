import { describe, expect, it } from 'vitest'
import { storagePathFor } from './storage'

describe('storagePathFor', () => {
  it('keeps safe characters', () => expect(storagePathFor('c1', 'My-call_1.2.mp3')).toBe('c1/My-call_1.2.mp3'))
  it('replaces runs of unsafe characters with a single underscore', () => {
    expect(storagePathFor('c1', 'a b  c/d?.mp3')).toBe('c1/a_b_c_d_.mp3')
  })
  it('keeps the last 100 characters of long names', () => {
    const name = 'x'.repeat(50) + 'y'.repeat(100)
    expect(storagePathFor('c1', name)).toBe(`c1/${'y'.repeat(100)}`)
  })
  it('falls back to recording.mp3 for empty or all-unsafe names', () => {
    expect(storagePathFor('c1', '')).toBe('c1/recording.mp3')
    expect(storagePathFor('c1', '???')).toBe('c1/recording.mp3')
  })
  it('always prefixes the call id', () => expect(storagePathFor('abc-123', 'x.wav').startsWith('abc-123/')).toBe(true))
  it('falls back for dot-only names', () => expect(storagePathFor('c1', '..')).toBe('c1/recording.mp3'))
  it('neutralises path traversal', () => {
    const p = storagePathFor('c1', '../../x.mp3')
    expect(p.split('/')).not.toContain('..')
    expect(p.endsWith('x.mp3')).toBe(true)
  })
  it('makes unicode names safe', () => expect(storagePathFor('c1', 'llamada ñ.mp3')).toBe('c1/llamada_.mp3'))
})
