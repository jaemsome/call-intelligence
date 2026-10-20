import { Star } from 'lucide-react'
import { GRADE_LABEL, GRADE_TONE } from '@/lib/labels'
import type { CallListItem } from '@/lib/types'
import { Badge } from './Badge'

export function GradePill({ call }: { call: Pick<CallListItem, 'score' | 'max_score' | 'grade' | 'call_type'> }) {
  if (call.call_type === 'not_scorable') return <Badge>Not scored</Badge>
  if (call.score == null || !call.grade) return <span className="text-sm text-ink-3">—</span>
  return (
    <Badge tone={GRADE_TONE[call.grade]}>
      {call.grade === 'gold' && <Star className="size-3" aria-hidden />}
      <span className="tabular-nums">{call.score}/{call.max_score}</span> · {GRADE_LABEL[call.grade]}
    </Badge>
  )
}
