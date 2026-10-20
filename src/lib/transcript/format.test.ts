import { describe, expect, it } from 'vitest'
import { segmentsFromUtterances, numberTranscript, speakerCount } from './format'

const u = (speaker: number, start: number, end: number, transcript: string) => ({ speaker, start, end, transcript })

describe('segmentsFromUtterances', () => {
  it('merges consecutive same-speaker utterances with short gaps', () => {
    const out = segmentsFromUtterances([u(0, 0, 2, 'Hello,'), u(0, 2.5, 4, 'this is Michelle.'), u(1, 4.2, 6, 'Hi!')])
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ idx: 0, speaker: 0, role: 'unknown', start_ms: 0, end_ms: 4000, text: 'Hello, this is Michelle.' })
    expect(out[1]).toMatchObject({ idx: 1, speaker: 1, start_ms: 4200, text: 'Hi!' })
  })
  it('does not merge across a long pause', () => {
    expect(segmentsFromUtterances([u(0, 0, 1, 'One.'), u(0, 5, 6, 'Two.')])).toHaveLength(2)
  })
  it('does not merge past 600 characters', () => {
    const long = 'a'.repeat(590)
    expect(segmentsFromUtterances([u(0, 0, 1, long), u(0, 1.2, 2, 'more words here')])).toHaveLength(2)
  })
  it('drops empty utterances', () => {
    expect(segmentsFromUtterances([u(0, 0, 1, '  '), u(1, 1, 2, 'Yes')])).toHaveLength(1)
  })
})

describe('numberTranscript', () => {
  const segs = [
    { idx: 0, speaker: 0, role: 'rep' as const, start_ms: 5000, end_ms: 7000, text: 'Hello, this is Michelle.' },
    { idx: 1, speaker: 1, role: 'customer' as const, start_ms: 221000, end_ms: 222000, text: 'I have ants.' },
  ]
  it('uses speaker numbers by default', () => {
    expect(numberTranscript(segs)).toBe('[0] S0 (0:05): Hello, this is Michelle.\n[1] S1 (3:41): I have ants.')
  })
  it('uses roles when asked', () => {
    expect(numberTranscript(segs, { roles: true })).toBe('[0] REP (0:05): Hello, this is Michelle.\n[1] CUSTOMER (3:41): I have ants.')
  })
})

describe('speakerCount', () => {
  it('counts distinct speakers', () => {
    expect(speakerCount([{ speaker: 0 }, { speaker: 1 }, { speaker: 0 }])).toBe(2)
  })
})
