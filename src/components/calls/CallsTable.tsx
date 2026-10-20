import Link from 'next/link'
import { AlertTriangle, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { GradePill } from '@/components/ui/GradePill'
import { Spinner } from '@/components/ui/Spinner'
import { CALL_TYPE_LABEL, OUTCOME_LABEL, OUTCOME_TONE, STATUS_LABEL, isProcessing } from '@/lib/labels'
import type { CallListItem, CallStatus } from '@/lib/types'
import { formatDateShort, formatDuration } from '@/lib/utils'
import { RetryButton } from './RetryButton'

type Live = Record<string, { status: CallStatus }>

/** Non-interactive status display; the Retry action is rendered separately so it never sits inside a link. */
function StatusBadges({ call, status }: { call: CallListItem; status: CallStatus }) {
  if (status === 'failed') return <Badge tone="bad">Failed</Badge>
  if (isProcessing(status)) return <Badge tone="accent"><Spinner className="size-3" />{STATUS_LABEL[status]}…</Badge>
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <GradePill call={call} />
      {call.needs_review && <Badge tone="warn"><AlertTriangle className="size-3" aria-hidden />Review</Badge>}
    </span>
  )
}

const TH = 'px-4 py-3'
const TD = 'px-4 py-3'

export function CallsTable({ calls, live }: { calls: CallListItem[]; live: Live }) {
  const statusOf = (c: CallListItem) => live[c.id]?.status ?? c.status
  return (
    <>
      <ul className="flex flex-col gap-2 md:hidden">
        {calls.map((c) => (
          <li key={c.id} className="rounded-2xl border border-line bg-surface transition-colors duration-200 hover:bg-surface-2">
            <Link href={`/calls/${c.id}`} className="block cursor-pointer rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{c.customer_name ?? c.label}</p>
                <span className="text-xs text-ink-3">{formatDuration(c.duration_sec)}</span>
              </div>
              <p className="mt-0.5 text-sm text-ink-3">{c.label} · {c.rep?.name ?? 'Unknown rep'} · {formatDateShort(c.created_at)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {c.call_type && <Badge>{CALL_TYPE_LABEL[c.call_type]}</Badge>}
                {c.outcome && <Badge tone={OUTCOME_TONE[c.outcome]}>{OUTCOME_LABEL[c.outcome]}</Badge>}
                <StatusBadges call={c} status={statusOf(c)} />
              </div>
            </Link>
            {statusOf(c) === 'failed' && <div className="px-4 pb-4"><RetryButton callId={c.id} /></div>}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Calls</caption>
          <thead className="border-b border-line text-[11px] font-semibold tracking-wide text-ink-3 uppercase">
            <tr>
              <th scope="col" className={TH}>Call</th><th scope="col" className={TH}>Type</th><th scope="col" className={TH}>Rep</th>
              <th scope="col" className={TH}>Customer</th><th scope="col" className={TH}>Length</th><th scope="col" className={TH}>Outcome</th><th scope="col" className={TH}>Score</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id} className="relative cursor-pointer border-b border-line transition-colors duration-200 last:border-0 hover:bg-surface-2">
                <td className={TD}>
                  {/* Stretched link: the ::after covers the whole row so any cell opens the call. */}
                  <Link href={`/calls/${c.id}`} className="flex items-center gap-2 font-medium after:absolute after:inset-0 after:content-[''] hover:text-accent focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-accent">
                    <Phone className="size-4 text-ink-3" aria-hidden />{c.label}
                  </Link>
                  <span className="block pl-6 text-xs text-ink-3">{formatDateShort(c.created_at)}</span>
                </td>
                <td className={TD}>{c.call_type ? <Badge>{CALL_TYPE_LABEL[c.call_type]}</Badge> : '—'}</td>
                <td className={TD}>{c.rep?.name ?? '—'}</td>
                <td className={TD}>{c.customer_name ?? '—'}</td>
                <td className={`${TD} tabular-nums`}>{formatDuration(c.duration_sec)}</td>
                <td className={TD}>{c.outcome ? <Badge tone={OUTCOME_TONE[c.outcome]}>{OUTCOME_LABEL[c.outcome]}</Badge> : '—'}</td>
                <td className={TD}>
                  <span className="flex items-center gap-2">
                    <StatusBadges call={c} status={statusOf(c)} />
                    {statusOf(c) === 'failed' && <RetryButton callId={c.id} className="relative z-10" />}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
