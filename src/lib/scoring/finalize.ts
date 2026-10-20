import type { Grade, ItemStatus, ScoreItemResult } from '@/lib/types'
import type { Scorecard, ScorecardItem } from '@/lib/scorecards'
import { isNaAllowed, type NaContext } from './naRules'
import { verifyQuote } from './verify'

export type RawItem = { key: string; status: ItemStatus; line: number | null; quote: string | null; note: string }
export type FinalizeContext = NaContext & { solutionHasCost: boolean; lowConfidence: boolean }
export type FinalizeInput = { scorecard: Scorecard; items: RawItem[]; segments: Array<{ idx: number; text: string }>; ctx: FinalizeContext }
export type FinalizeResult = { items: ScoreItemResult[]; score: number; maxScore: number; grade: Grade; needsReview: boolean }

/** Lower is worse: duplicates resolve to the worst status. */
const STATUS_RANK: Record<ItemStatus, number> = { miss: 0, na: 1, hit: 2 }

export function gradeFor(score: number, scorecard: Scorecard): Grade {
  if (score >= scorecard.thresholds.gold) return 'gold'
  if (score >= scorecard.thresholds.green) return 'green'
  return 'below'
}

const result = (def: ScorecardItem, status: ItemStatus, line: number | null, quote: string | null, verified: boolean, note: string): ScoreItemResult => ({
  item_key: def.key, quadrant: def.quadrant, status, line_idx: line, quote, verified, note,
})

/** All-calls manual: when the solution costs nothing, the Consensus is also the Close. */
function applyNoCostClose(scorecard: Scorecard, items: ScoreItemResult[], solutionHasCost: boolean) {
  if (scorecard.kind !== 'all_calls_12' || solutionHasCost) return
  const consensus = items.find((i) => i.item_key === 'consensus')
  const close = items.find((i) => i.item_key === 'close')
  if (consensus?.status === 'hit' && close?.status === 'miss') {
    Object.assign(close, { status: 'hit', line_idx: consensus.line_idx, quote: consensus.quote, verified: consensus.verified, note: 'No-cost solution: the Consensus doubles as the Close.' })
  }
}

/** Turns raw model judgements into trusted scores: enforces N/A rules, verifies evidence, totals and grades. */
export function finalizeScore({ scorecard, items, segments, ctx }: FinalizeInput): FinalizeResult {
  let needsReview = ctx.lowConfidence
  const known = new Set(scorecard.items.map((d) => d.key))
  const byKey = new Map<string, RawItem>()
  for (const item of items) {
    if (!known.has(item.key)) { needsReview = true; continue }
    const prev = byKey.get(item.key)
    if (prev) needsReview = true
    if (!prev || STATUS_RANK[item.status] < STATUS_RANK[prev.status]) byKey.set(item.key, item)
  }

  const results = scorecard.items.map((def) => {
    const raw = byKey.get(def.key)
    if (def.naRule === 'no_objections' && !ctx.objectionsRaised) return result(def, 'na', null, null, true, 'No objections raised — auto credit.')
    if (!raw) {
      needsReview = true
      return result(def, 'miss', null, null, false, 'Not assessed by the model.')
    }
    if (raw.status === 'na') {
      if (isNaAllowed(def.naRule, ctx)) return result(def, 'na', null, null, true, raw.note || 'Not applicable — auto credit.')
      needsReview = true
      return result(def, 'miss', raw.line, raw.quote, false, `Marked N/A, but N/A is not allowed here. ${raw.note}`.trim())
    }
    if (raw.status === 'miss') return result(def, 'miss', raw.line, raw.quote, true, raw.note)
    const check = verifyQuote(raw.quote, raw.line, segments)
    if (!check.verified) needsReview = true
    return result(def, 'hit', check.lineIdx, raw.quote, check.verified, raw.note)
  })

  applyNoCostClose(scorecard, results, ctx.solutionHasCost)
  const score = results.filter((r) => r.status !== 'miss').length
  return { items: results, score, maxScore: scorecard.maxScore, grade: gradeFor(score, scorecard), needsReview }
}
