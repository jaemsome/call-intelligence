import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { BarList } from '@/components/ui/BarList'
import { Card, CardTitle } from '@/components/ui/Card'
import { GradePill } from '@/components/ui/GradePill'
import { CALL_TYPE_LABEL } from '@/lib/labels'
import { getScorecard } from '@/lib/scorecards'
import type { OverviewData } from '@/lib/data/overview'

const ROW = 'flex min-h-11 items-center justify-between gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2'

export function CoachCard({ insights }: { insights: OverviewData['insights'] }) {
  const { missedSteps } = insights
  return (
    <Card>
      <CardTitle hint="Steps most often missed — coach these first">What to coach</CardTitle>
      {missedSteps.length ? (
        <BarList bars={missedSteps.slice(0, 6).map((s) => ({ label: s.label, sublabel: getScorecard(s.scorecard).title.replace(' Scorecard', ''), value: s.missed, max: s.total, display: `${s.missed}/${s.total} missed`, tone: s.missed / s.total >= 0.5 ? 'bad' : 'warn', href: `/calls/log?missed=${s.key}&scorecard=${s.scorecard}` }))} />
      ) : <p className="text-sm text-ink-3">Not enough scored calls yet.</p>}
    </Card>
  )
}

export function RetentionCard({ insights }: { insights: OverviewData['insights'] }) {
  const { retention, kpis } = insights
  const saved = kpis.retentionSaved
  const lost = kpis.retentionDecided - saved
  return (
    <Card>
      <CardTitle hint={`${saved} saved · ${lost} lost`}>Retention</CardTitle>
      {retention.length ? (
        <ul className="flex flex-col gap-1">
          {retention.slice(0, 6).map((r) => (
            <li key={r.callId}><Link href={`/calls/${r.callId}`} className={ROW}>
              <span className="min-w-0 truncate text-sm">{r.reason}</span>
              <Badge className="shrink-0" tone={r.outcome === 'saved' ? 'good' : 'bad'}>{r.outcome === 'saved' ? 'Saved' : 'Lost'}</Badge>
            </Link></li>
          ))}
        </ul>
      ) : <p className="text-sm text-ink-3">No cancel calls yet.</p>}
      {retention.length > 6 && <Link href="/calls/log?type=retention" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-accent-ink hover:underline">See all {retention.length} cancel calls</Link>}
    </Card>
  )
}

export function OverviewLists({ insights, attention }: Pick<OverviewData, 'insights' | 'attention'>) {
  const { typeMix, kpis } = insights
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardTitle>Call mix</CardTitle>
        <BarList bars={typeMix.map((t) => ({ label: CALL_TYPE_LABEL[t.type], value: t.count, max: kpis.analysed, display: String(t.count), tone: 'accent' as const, href: `/calls/log?type=${t.type}` }))} />
      </Card>
      <Card>
        <CardTitle hint="Start coaching here">Lowest-scoring calls</CardTitle>
        {attention.length === 0 ? <p className="text-sm text-ink-3">{kpis.scored === 0 ? 'No scored calls yet.' : 'No calls need coaching right now.'}</p> : (
        <ul className="flex flex-col gap-1">
          {attention.map((c) => (
            <li key={c.id}><Link href={`/calls/${c.id}`} className={ROW}>
              <span className="min-w-0"><span className="block truncate text-sm font-medium">{c.customer_name ?? c.label}</span><span className="block text-xs text-ink-3">{c.rep?.name ?? 'Unknown rep'}{c.call_type ? ` · ${CALL_TYPE_LABEL[c.call_type]}` : ''}</span></span>
              <GradePill call={c} />
            </Link></li>
          ))}
        </ul>
        )}
      </Card>
    </div>
  )
}
