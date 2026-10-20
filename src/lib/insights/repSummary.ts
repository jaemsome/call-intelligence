import type { CallListItem, Coaching, Grade, RepRef, ResultRow } from '@/lib/types'
import { rankMissedSteps, type MissedStep } from './buildInsights'

export type RepSummary = { rep: RepRef; calls: number; scored: number; avgPct: number | null; grades: Record<Grade, number>; topMissed: MissedStep | null }
export type CoachingStep = MissedStep & { examples: { id: string; label: string; created_at: string }[]; sayInstead: string | null }
type CallWithCoaching = CallListItem & { coaching?: Coaching | null }

export function buildRepSummaries(calls: CallListItem[], results: ResultRow[]): RepSummary[] {
  const byRep = new Map<string, CallListItem[]>()
  for (const c of calls) if (c.rep && c.status === 'done') byRep.set(c.rep.id, [...(byRep.get(c.rep.id) ?? []), c])
  return [...byRep.values()]
    .map((list) => {
      const scored = list.filter((c) => c.score != null && c.max_score)
      const grades: Record<Grade, number> = { gold: 0, green: 0, below: 0 }
      for (const c of scored) if (c.grade) grades[c.grade] += 1
      return {
        rep: list[0].rep as RepRef,
        calls: list.length,
        scored: scored.length,
        avgPct: scored.length ? Math.round((scored.reduce((s, c) => s + (c.score as number) / (c.max_score as number), 0) / scored.length) * 100) : null,
        grades,
        topMissed: rankMissedSteps(list, results)[0] ?? null,
      }
    })
    .sort((a, b) => (b.avgPct ?? -1) - (a.avgPct ?? -1) || a.rep.name.localeCompare(b.rep.name))
}

export function buildCoachingPlan(calls: CallWithCoaching[], results: ResultRow[]): CoachingStep[] {
  return rankMissedSteps(calls, results).slice(0, 3).map((step) => {
    const missedIds = new Set(results.filter((r) => r.item_key === step.key && r.status === 'miss').map((r) => r.call_id))
    const examples = calls.filter((c) => missedIds.has(c.id) && c.scorecard === step.scorecard)
    const fix = examples.map((c) => c.coaching?.fixes.find((f) => f.item_key === step.key)).find(Boolean)
    return { ...step, examples: examples.slice(0, 3).map((c) => ({ id: c.id, label: c.customer_name ?? c.label, created_at: c.created_at })), sayInstead: fix?.say_instead ?? null }
  })
}
