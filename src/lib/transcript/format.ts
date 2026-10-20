import type { Segment } from '@/lib/types'
import { formatTimestamp } from '@/lib/utils'

export type Utterance = { speaker: number; start: number; end: number; transcript: string }

const MAX_GAP_SEC = 1.5
const MAX_CHARS = 600

/** Deepgram utterances → numbered segments, merging consecutive turns by the same speaker. */
export function segmentsFromUtterances(utterances: Utterance[]): Segment[] {
  const out: Segment[] = []
  for (const u of utterances) {
    const text = u.transcript.trim()
    if (!text) continue
    const last = out[out.length - 1]
    const canMerge = last && last.speaker === u.speaker && u.start - last.end_ms / 1000 <= MAX_GAP_SEC && last.text.length + text.length < MAX_CHARS
    if (canMerge) {
      last.text = `${last.text} ${text}`
      last.end_ms = Math.round(u.end * 1000)
      continue
    }
    out.push({ idx: out.length, speaker: u.speaker, role: 'unknown', start_ms: Math.round(u.start * 1000), end_ms: Math.round(u.end * 1000), text })
  }
  return out
}

/** Model-facing transcript: one line per segment, e.g. "[12] REP (3:41): text". */
export function numberTranscript(segments: Segment[], opts: { roles?: boolean } = {}): string {
  return segments
    .map((s) => {
      const who = opts.roles ? s.role.toUpperCase() : `S${s.speaker}`
      return `[${s.idx}] ${who} (${formatTimestamp(s.start_ms)}): ${s.text}`
    })
    .join('\n')
}

export function speakerCount(segments: Array<Pick<Segment, 'speaker'>>): number {
  return new Set(segments.map((s) => s.speaker)).size
}
