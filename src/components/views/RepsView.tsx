import Link from 'next/link'
import { ChevronRight, Users } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { RepSummary } from '@/lib/insights/repSummary'
import { plural } from '@/lib/utils'

export function RepsView({ reps }: { reps: RepSummary[] }) {
  return (
    <>
      <PageHeader title="Reps" subtitle="Who's doing well, where, and what to coach next." />
      {reps.length === 0 ? <EmptyState icon={Users} title="No reps yet" text="Reps appear automatically once calls are analysed." /> : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {reps.map((r) => (
            <li key={r.rep.id}>
              <Link
                href={`/calls/reps/${r.rep.id}`}
                className="flex h-full min-h-11 flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-lg font-semibold">{r.rep.name}</p>
                  <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />
                </div>
                <p className="text-sm text-ink-3">{plural(r.calls, 'call')} · {r.avgPct == null ? 'not scored yet' : `avg ${r.avgPct}%`}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone="accent">{r.grades.gold} Gold</Badge>
                  <Badge tone="good">{r.grades.green} Green</Badge>
                  <Badge tone="bad">{r.grades.below} Below standard</Badge>
                </div>
                {!r.topMissed && <p className="mt-4 text-sm text-ink-3">{r.calls < 2 ? 'Not enough calls to suggest coaching yet' : 'No repeat misses'}</p>}
                {r.topMissed && (
                  <p className="mt-4 text-sm">
                    <span className="text-ink-3">Coach next: </span>
                    <span className="font-medium">{r.topMissed.label}</span>{' '}
                    <span className="text-ink-3">(missed on {r.topMissed.missed} of {r.topMissed.total} calls)</span>
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
