import Link from 'next/link'
import { ArrowLeft, Lightbulb } from 'lucide-react'
import { CallsTable } from '@/components/calls/CallsTable'
import { Card, CardTitle } from '@/components/ui/Card'
import { StatTile } from '@/components/ui/StatTile'
import { formatDateShort } from '@/lib/utils'
import type { RepDetailData } from '@/lib/data/reps'

export function RepDetailView({ rep, summary, plan, calls }: RepDetailData) {
  return (
    <>
      <Link href="/calls/reps" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm text-ink-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <ArrowLeft className="size-4" aria-hidden />All reps
      </Link>
      <h1 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl">{rep.name}</h1>
      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <StatTile label="Calls" value={String(summary?.calls ?? 0)} />
          <StatTile label="Avg score" value={summary?.avgPct == null ? '—' : `${summary.avgPct}%`} />
          <StatTile label="Gold" value={String(summary?.grades.gold ?? 0)} tone="accent" />
          <StatTile label="Below standard" value={String(summary?.grades.below ?? 0)} tone={summary?.grades.below ? 'bad' : 'good'} />
        </div>
      </Card>
      <Card accent className="mb-4">
        <CardTitle hint="The three steps that will move this rep's scores most">Coaching plan</CardTitle>
        {plan.length === 0 ? <p className="text-sm text-ink-3">{(summary?.scored ?? 0) < 2 ? 'Not enough scored calls yet — a pattern needs at least 2.' : 'No step missed more than once — nice work.'}</p> : (
          <ol className="flex flex-col gap-4">
            {plan.map((s, i) => (
              <li key={`${s.scorecard}-${s.key}`} className="rounded-xl bg-surface-2 p-4">
                <p className="font-medium">{i + 1}. {s.label} <span className="text-sm font-normal text-ink-3">— missed on {s.missed} of {s.total} calls</span></p>
                {s.sayInstead && (
                  <p className="mt-2 flex items-start gap-2 text-sm">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-good" aria-hidden />
                    <span><span className="font-medium">Say this instead: </span><span className="italic">“{s.sayInstead}”</span></span>
                  </p>
                )}
                {s.examples.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-1 text-sm text-ink-3">
                    <span>Example calls:</span>
                    <ul className="flex flex-wrap">
                      {s.examples.map((e) => (
                        <li key={e.id}>
                          <Link href={`/calls/${e.id}`} className="inline-flex min-h-11 items-center rounded-md px-2 text-accent-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent">{e.label} · {formatDateShort(e.created_at)}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>
      <h2 className="mb-3 text-base font-semibold md:text-lg">Calls</h2>
      <CallsTable calls={calls} live={{}} />
    </>
  )
}
