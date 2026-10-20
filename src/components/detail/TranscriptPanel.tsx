'use client'

import { useCallback, useMemo } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { itemLabel } from '@/lib/scorecards'
import type { ScoreItemResult, ScorecardKind, Segment } from '@/lib/types'
import { useSeekActions, useSeekTime } from './SeekContext'
import { TranscriptRow } from './TranscriptRow'

type Props = { segments: Segment[]; results: ScoreItemResult[]; scorecard: ScorecardKind | null; repName: string | null }

/** Index (idx field) of the last segment starting at or before ms; -1 if none. Segments are sorted by start_ms. */
function findActiveIdx(segments: Segment[], ms: number): number {
  let lo = 0
  let hi = segments.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (segments[mid].start_ms <= ms) { found = mid; lo = mid + 1 } else hi = mid - 1
  }
  return found === -1 ? -1 : segments[found].idx
}

function speakerLabel(s: Segment, repName: string | null): string {
  if (s.role === 'rep') return repName ?? 'Rep'
  if (s.role === 'customer') return 'Customer'
  return `Speaker ${s.speaker + 1}`
}

export function TranscriptPanel({ segments: input, results, scorecard, repName }: Props) {
  // Keep the original array when already sorted (stable identity); otherwise sort a copy.
  const segments = useMemo(
    () => (input.every((s, i) => i === 0 || input[i - 1].start_ms <= s.start_ms) ? input : [...input].sort((a, b) => a.start_ms - b.start_ms)),
    [input],
  )
  const currentMs = useSeekTime()
  const { focusedLine, seek } = useSeekActions()

  // Only verified hits are highlighted; unverified ones are flagged in the scorecard panel.
  const evidence = useMemo(() => {
    const map = new Map<number, string[]>()
    if (!scorecard) return map
    for (const r of results) {
      if (r.status !== 'hit' || r.line_idx == null || r.verified !== true) continue
      map.set(r.line_idx, [...(map.get(r.line_idx) ?? []), itemLabel(scorecard, r.item_key)])
    }
    return map
  }, [results, scorecard])

  const activeIdx = findActiveIdx(segments, currentMs)
  const onSeek = useCallback((ms: number) => seek(ms), [seek])

  return (
    <Card className="p-0 md:p-0">
      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <CardTitle hint={`${segments.length} turns · tap a time to listen`}>Transcript</CardTitle>
      </div>
      {segments.length === 0 ? (
        <p className="px-4 pb-6 text-sm text-ink-3 md:px-6">No transcript yet.</p>
      ) : (
        <ol
          tabIndex={0}
          aria-label="Call transcript"
          className="flex flex-col pb-2 focus-visible:outline-2 focus-visible:outline-accent lg:max-h-[calc(100dvh-14rem)] lg:overflow-y-auto"
        >
          {segments.map((s) => (
            <TranscriptRow
              key={s.idx}
              idx={s.idx}
              start={s.start_ms}
              text={s.text}
              isRep={s.role === 'rep'}
              who={speakerLabel(s, repName)}
              isActive={s.idx === activeIdx}
              isFocused={s.idx === focusedLine}
              tags={evidence.get(s.idx)?.join('|') ?? ''}
              onSeek={onSeek}
            />
          ))}
        </ol>
      )}
    </Card>
  )
}
