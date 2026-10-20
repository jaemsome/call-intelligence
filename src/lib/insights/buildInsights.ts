import type { CallListItem, CallType, ResultRow, ScorecardKind } from '@/lib/types'
import { itemLabel } from '@/lib/scorecards'
import { percent, plural } from '@/lib/utils'

export type Kpis = { analysed: number; scored: number; avgPct: number | null; salesCount: number; salesBooked: number; salesCloseRate: number | null; retentionCount: number; retentionSaved: number; retentionDecided: number; saveRate: number | null; needsReview: number }
export type Leak = { id: string; tone: 'bad' | 'warn'; title: string; detail: string; count: number; actionLabel: string; href: string }
export type MissedStep = { scorecard: ScorecardKind; key: string; label: string; missed: number; total: number }
export type Insights = { kpis: Kpis; leaks: Leak[]; missedSteps: MissedStep[]; typeMix: { type: CallType; count: number }[]; retention: { callId: string; reason: string; outcome: 'saved' | 'cancelled' }[] }

const missedOn = (results: ResultRow[], key: string, ids: Set<string>) => results.filter((r) => r.item_key === key && r.status === 'miss' && ids.has(r.call_id)).length

export function rankMissedSteps(calls: CallListItem[], results: ResultRow[]): MissedStep[] {
  const kindById = new Map(calls.filter((c) => c.scorecard).map((c) => [c.id, c.scorecard as ScorecardKind]))
  const tally = new Map<string, MissedStep>()
  for (const r of results) {
    const kind = kindById.get(r.call_id)
    if (!kind || r.status === 'na') continue
    const id = `${kind}:${r.item_key}`
    const t = tally.get(id) ?? { scorecard: kind, key: r.item_key, label: itemLabel(kind, r.item_key), missed: 0, total: 0 }
    t.total += 1
    if (r.status === 'miss') t.missed += 1
    tally.set(id, t)
  }
  return [...tally.values()].filter((t) => t.total >= 2 && t.missed > 0).sort((a, b) => b.missed / b.total - a.missed / a.total || b.missed - a.missed)
}

export function buildInsights(calls: CallListItem[], results: ResultRow[]): Insights {
  const done = calls.filter((c) => c.status === 'done')
  const scored = done.filter((c) => c.score != null && c.max_score)
  const sales = done.filter((c) => c.call_type === 'sales')
  const retention = done.filter((c) => c.call_type === 'retention')
  const saved = retention.filter((c) => c.outcome === 'saved').length
  const cancelled = retention.filter((c) => c.outcome === 'cancelled')
  const salesBooked = sales.filter((c) => c.outcome === 'booked').length
  const salesIds = new Set(sales.filter((c) => c.scorecard === 'sales_17').map((c) => c.id))
  const reviewCount = done.filter((c) => c.needs_review).length

  const kpis: Kpis = {
    analysed: done.length,
    scored: scored.length,
    avgPct: scored.length ? Math.round((scored.reduce((s, c) => s + (c.score as number) / (c.max_score as number), 0) / scored.length) * 100) : null,
    salesCount: sales.length,
    salesBooked,
    salesCloseRate: percent(salesBooked, sales.length),
    retentionCount: retention.length,
    retentionSaved: saved,
    retentionDecided: saved + cancelled.length,
    saveRate: percent(saved, saved + cancelled.length),
    needsReview: reviewCount,
  }

  const missedSteps = rankMissedSteps(done, results)
  const top = missedSteps[0]
  const noClose = missedOn(results, 'close', salesIds)
  const open = sales.filter((c) => c.outcome === 'not_booked' || c.outcome === 'follow_up').length
  const noOffer = missedOn(results, 'present_solution', new Set(cancelled.map((c) => c.id)))

  const leaks: Leak[] = [
    { id: 'sales_no_close', tone: 'bad' as const, count: noClose, title: `${plural(noClose, 'sales call')} ended without a close attempt`, detail: 'The rep never asked for the booking. These are the easiest wins to coach.', actionLabel: 'Review calls', href: '/calls/log?type=sales&missed=close&scorecard=sales_17' },
    { id: 'retention_no_offer', tone: 'bad' as const, count: noOffer, title: `${plural(noOffer, 'cancellation')} lost without a save offer`, detail: 'No save offer (free re-service, pause, discount) was made before the customer cancelled.', actionLabel: 'Review calls', href: '/calls/log?type=retention&outcome=cancelled&missed=present_solution' },
    { id: 'sales_open', tone: 'warn' as const, count: open, title: `${plural(open, 'sales lead')} not booked yet`, detail: 'Follow up today while the pest problem is still fresh.', actionLabel: 'See leads', href: '/calls/log?type=sales&outcome=open' },
    ...(top && top.missed / top.total >= 0.5 && !(top.key === 'close' && top.scorecard === 'sales_17')
      ? [{ id: 'most_missed', tone: 'warn' as const, count: top.missed, title: `Most-missed step: ${top.label}`, detail: `Missed in ${top.missed} of ${top.total} scored calls — coach this first.`, actionLabel: 'See examples', href: `/calls/log?missed=${top.key}&scorecard=${top.scorecard}` }]
      : []),
    { id: 'needs_review', tone: 'warn' as const, count: reviewCount, title: `${plural(reviewCount, 'call')} need a quick human check`, detail: 'Some evidence could not be matched to the transcript.', actionLabel: 'Check calls', href: '/calls/log?review=1' },
  ]
    .filter((l) => l.count > 0)
    .sort((a, b) => Number(b.tone === 'bad') - Number(a.tone === 'bad') || b.count - a.count)

  const typeCounts = new Map<CallType, number>()
  for (const c of done) if (c.call_type) typeCounts.set(c.call_type, (typeCounts.get(c.call_type) ?? 0) + 1)

  return {
    kpis,
    leaks,
    missedSteps,
    typeMix: [...typeCounts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    retention: retention
      .filter((c) => c.outcome === 'saved' || c.outcome === 'cancelled')
      .map((c) => ({ callId: c.id, reason: c.details?.cancel_reason ?? 'Reason not stated', outcome: c.outcome as 'saved' | 'cancelled' })),
  }
}
