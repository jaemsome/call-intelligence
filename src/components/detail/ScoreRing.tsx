import { GRADE_LABEL, GRADE_TONE } from '@/lib/labels'
import type { Grade } from '@/lib/types'
import { TONE_TEXT } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export function ScoreRing({ score, max, grade }: { score: number; max: number; grade: Grade }) {
  const r = 30
  const c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(Math.max(score / max, 0), 1) : 0
  const tone = TONE_TEXT[GRADE_TONE[grade]]
  return (
    <div role="img" className="flex items-center gap-3" aria-label={`Score ${score} of ${max}, ${GRADE_LABEL[grade]}`}>
      <svg viewBox="0 0 72 72" className={cn('size-16 -rotate-90', tone)} aria-hidden="true" focusable="false">
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="7" className="stroke-line" />
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="7" stroke="currentColor" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
      </svg>
      <div aria-hidden="true">
        <p className="text-2xl font-bold tabular-nums">{score}<span className="text-base font-medium text-ink-3">/{max}</span></p>
        <p className={cn('text-sm font-medium', tone)}>{GRADE_LABEL[grade]}</p>
      </div>
    </div>
  )
}
