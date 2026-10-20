'use client'

import { Card, CardTitle } from '@/components/ui/Card'
import { QUADRANT_LABEL } from '@/lib/labels'
import { getScorecard } from '@/lib/scorecards'
import type { Quadrant, ScoreItemResult, ScorecardKind } from '@/lib/types'
import { useSeekActions } from './SeekContext'
import { ScorecardItem } from './ScorecardItem'

export function ScorecardPanel({ kind, results, score, maxScore, onLine }: { kind: ScorecardKind; results: ScoreItemResult[]; score: number | null; maxScore: number | null; onLine: (idx: number) => void }) {
  useSeekActions() // actions-only context: no 4Hz re-renders
  const sc = getScorecard(kind)
  const byKey = new Map(results.map((r) => [r.item_key, r]))
  const quadrants = [...new Set(sc.items.map((i) => i.quadrant))] as Quadrant[]
  const keys = new Set(sc.items.map((i) => i.key))
  const earned = score ?? results.filter((r) => keys.has(r.item_key) && r.status !== 'miss').length
  const total = maxScore ?? sc.maxScore

  return (
    <Card>
      <CardTitle hint={`${earned} of ${total} points`}>{sc.title}</CardTitle>
      <div className="flex flex-col gap-5">
        {quadrants.map((q) => (
          <section key={q} aria-label={QUADRANT_LABEL[q]}>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3">{QUADRANT_LABEL[q]}</h3>
            <ul className="flex flex-col gap-1">
              {sc.items.filter((i) => i.quadrant === q).map((item) => (
                <ScorecardItem key={item.key} label={item.label} result={byKey.get(item.key)} onLine={onLine} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  )
}
