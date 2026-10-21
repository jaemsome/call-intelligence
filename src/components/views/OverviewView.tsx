import { PhoneCall } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { UploadCallButton } from '@/components/calls/UploadCallButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatTile } from '@/components/ui/StatTile'
import { LeakCard } from '@/components/calls/LeakCard'
import { CoachCard, OverviewLists, RetentionCard } from '@/components/calls/OverviewLists'
import type { Tone } from '@/lib/labels'
import type { OverviewData } from '@/lib/data/overview'

const pctTone = (v: number | null): Tone => (v == null ? 'neutral' : v >= 85 ? 'good' : v >= 70 ? 'warn' : 'bad')
const show = (v: number | null) => (v == null ? '—' : `${v}%`)

export function OverviewView({ insights, attention, processing, total }: OverviewData) {
  const { kpis, leaks } = insights
  const upload = <UploadCallButton />
  if (total === 0) {
    return (
      <>
        <PageHeader title="Call Intelligence" />
        <EmptyState icon={PhoneCall} title="No calls yet" text="Upload your first recording to see scores, coaching and leaks here." action={upload} />
      </>
    )
  }
  return (
    <>
      <PageHeader title="Call Intelligence" subtitle="Every call scored against your scorecards, turned into what to fix next." actions={upload} />
      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
          <StatTile label="Calls reviewed" value={String(kpis.analysed)} hint={processing ? `${processing} processing` : `${kpis.scored} scored`} />
          <StatTile label="Average call score" value={show(kpis.avgPct)} tone={pctTone(kpis.avgPct)} hint="How closely reps followed the script" />
          <StatTile label="Sales calls booked" value={show(kpis.salesCloseRate)} tone={pctTone(kpis.salesCloseRate)} hint={`${kpis.salesBooked} of ${kpis.salesCount} sales calls`} />
          <StatTile label="Cancellations saved" value={show(kpis.saveRate)} tone={pctTone(kpis.saveRate)} hint={`${kpis.retentionSaved} of ${kpis.retentionDecided} decided`} />
          <StatTile label="Calls to double-check" value={String(kpis.needsReview)} tone={kpis.needsReview ? 'warn' : 'good'} hint="Some quotes couldn't be verified" />
        </div>
      </Card>

      <Card accent className="mb-4">
        <CardTitle hint="Where calls are losing customers or revenue right now">Leaks to fix</CardTitle>
        {leaks.length ? <div className="flex flex-col gap-3">{leaks.map((l) => <LeakCard key={l.id} leak={l} />)}</div> : <p className="text-sm text-ink-3">{kpis.scored === 0 ? 'Leaks appear once calls are scored.' : 'No leaks right now — nice work.'}</p>}
      </Card>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <CoachCard insights={insights} />
        <RetentionCard insights={insights} />
      </div>
      <OverviewLists insights={insights} attention={attention} />
    </>
  )
}
