import { CALL_TYPES, GRADES, OUTCOMES, type CallListItem, type CallOutcome, type CallType, type Grade, type ResultRow, type ScorecardKind } from '@/lib/types'

export type CallFilters = {
  type?: CallType
  rep?: string
  grade?: Grade
  outcome?: CallOutcome | 'open'
  missed?: string
  scorecard?: ScorecardKind
  review?: boolean
  q?: string
}

const SCORECARDS = ['sales_17', 'all_calls_12', 'retention_12']

type Params = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined)

export function parseFilters(params: Params): CallFilters {
  const f: CallFilters = {}
  const type = one(params.type)
  if (type && (CALL_TYPES as string[]).includes(type)) f.type = type as CallType
  const grade = one(params.grade)
  if (grade && (GRADES as string[]).includes(grade)) f.grade = grade as Grade
  const outcome = one(params.outcome)
  if (outcome === 'open' || (outcome && (OUTCOMES as string[]).includes(outcome))) f.outcome = outcome as CallFilters['outcome']
  const rep = one(params.rep)
  if (rep && /^[0-9a-f-]{1,36}$/i.test(rep)) f.rep = rep
  const missed = one(params.missed)
  if (missed && /^[a-z0-9_]{1,40}$/.test(missed)) f.missed = missed
  const scorecard = one(params.scorecard)
  if (scorecard && SCORECARDS.includes(scorecard)) f.scorecard = scorecard as ScorecardKind
  if (one(params.review) === '1') f.review = true
  const q = one(params.q)?.trim().slice(0, 100)
  if (q) f.q = q
  return f
}

export function filterCalls(calls: CallListItem[], results: ResultRow[], f: CallFilters): CallListItem[] {
  const missedIds = f.missed ? new Set(results.filter((r) => r.item_key === f.missed && r.status === 'miss').map((r) => r.call_id)) : null
  const q = f.q?.toLowerCase()
  return calls.filter((c) => {
    if (f.type && c.call_type !== f.type) return false
    if (f.grade && c.grade !== f.grade) return false
    if (f.rep && c.rep?.id !== f.rep) return false
    if (f.scorecard && c.scorecard !== f.scorecard) return false
    if (f.review && !c.needs_review) return false
    if (f.outcome === 'open' && c.outcome !== 'not_booked' && c.outcome !== 'follow_up') return false
    if (f.outcome && f.outcome !== 'open' && c.outcome !== f.outcome) return false
    if (missedIds && !missedIds.has(c.id)) return false
    if (q && ![c.label, c.customer_name, c.rep?.name, c.summary].some((s) => s?.toLowerCase().includes(q))) return false
    return true
  })
}
