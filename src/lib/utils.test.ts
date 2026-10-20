import { describe, expect, it } from 'vitest'
import { cn, formatDuration, formatTimestamp, normalizeText, percent, labelFromFilename, formatDateShort, formatDateFull, plural } from './utils'

describe('cn', () => {
  it('joins truthy class names', () => expect(cn('a', false, null, undefined, 'b')).toBe('a b'))
  it('returns empty string for nothing', () => expect(cn()).toBe(''))
})

describe('formatDuration', () => {
  it('formats seconds as m:ss', () => expect(formatDuration(95)).toBe('1:35'))
  it('pads seconds', () => expect(formatDuration(62)).toBe('1:02'))
  it('formats hours', () => expect(formatDuration(3725)).toBe('1:02:05'))
  it('handles zero', () => expect(formatDuration(0)).toBe('0:00'))
  it('rounds fractions', () => expect(formatDuration(46.8)).toBe('0:47'))
  it('returns dash for null, negative or NaN', () => {
    expect(formatDuration(null)).toBe('—')
    expect(formatDuration(-1)).toBe('—')
    expect(formatDuration(Number.NaN)).toBe('—')
  })
})

describe('formatTimestamp', () => {
  it('formats milliseconds', () => expect(formatTimestamp(221_000)).toBe('3:41'))
  it('handles zero', () => expect(formatTimestamp(0)).toBe('0:00'))
})

describe('normalizeText', () => {
  it('lowercases, strips punctuation and collapses spaces', () =>
    expect(normalizeText('  Hello!  This is   Michelle, with ABC. ')).toBe('hello this is michelle with abc'))
  it('keeps apostrophes and unifies curly ones', () => expect(normalizeText('I’m so sorry')).toBe("i'm so sorry"))
  it('handles empty', () => expect(normalizeText('')).toBe(''))
})

describe('percent', () => {
  it('rounds to whole percent', () => expect(percent(1, 3)).toBe(33))
  it('returns null when denominator is zero', () => expect(percent(5, 0)).toBeNull())
  it('handles full', () => expect(percent(4, 4)).toBe(100))
})

describe('labelFromFilename', () => {
  it('strips extension and extra spaces', () => expect(labelFromFilename('CALL  008.mp3')).toBe('CALL 008'))
  it('removes path parts', () => expect(labelFromFilename('dir/sub/CALL 020.MP3')).toBe('CALL 020'))
  it('caps length at 80', () => expect(labelFromFilename(`${'x'.repeat(100)}.mp3`)).toHaveLength(80))
  it('falls back for empty names', () => expect(labelFromFilename('.mp3')).toBe('Untitled call'))
})

describe('dates', () => {
  const iso = '2026-10-18T15:04:00.000Z'
  it('formatDateShort gives month and day', () => expect(formatDateShort(iso)).toMatch(/Oct 18/))
  it('formatDateFull includes year', () => expect(formatDateFull(iso)).toMatch(/2026/))
  it('returns dash for invalid input', () => {
    expect(formatDateShort('nope')).toBe('—')
    expect(formatDateFull(null)).toBe('—')
  })
})

describe('plural', () => {
  it('singular', () => expect(plural(1, 'call')).toBe('1 call'))
  it('plural', () => expect(plural(3, 'call')).toBe('3 calls'))
  it('zero', () => expect(plural(0, 'call')).toBe('0 calls'))
})
