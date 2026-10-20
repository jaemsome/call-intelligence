import { AlertTriangle, CheckCircle2, MinusCircle, XCircle } from 'lucide-react'
import type { ItemStatus, ScoreItemResult } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS: Record<ItemStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  hit: { label: 'Hit', icon: CheckCircle2, className: 'text-good' },
  miss: { label: 'Missed', icon: XCircle, className: 'text-bad' },
  na: { label: 'N/A — auto credit', icon: MinusCircle, className: 'text-ink-3' },
}

export function ScorecardItem({ label, result, onLine }: { label: string; result: ScoreItemResult | undefined; onLine: (idx: number) => void }) {
  const status = result?.status ?? 'miss'
  const s = STATUS[status]
  const Icon = s.icon
  const lineIdx = result?.line_idx
  return (
    <li className="rounded-xl px-2 py-2 hover:bg-surface-2">
      <div className="flex items-center gap-2">
        <Icon className={cn('size-4 shrink-0', s.className)} aria-hidden />
        <span className="flex-1 text-sm font-medium">{label}</span>
        <span className={cn('text-xs', s.className)}>{s.label}</span>
      </div>
      {result?.quote && status === 'hit' && (
        lineIdx != null ? (
          <button type="button" onClick={() => onLine(lineIdx)}
            className="mt-1 ml-6 block min-h-11 cursor-pointer md:min-h-8 text-left text-sm italic text-ink-2 transition-colors hover:text-accent-ink">
            <span className="sr-only">Jump to this moment for {label}: </span>“{result.quote}”
          </button>
        ) : (
          <p className="mt-1 ml-6 text-sm italic text-ink-2">“{result.quote}”</p>
        )
      )}
      {result && !result.verified && status === 'hit' && (
        <p className="mt-1 ml-6 flex items-center gap-1 text-xs text-warn">
          <AlertTriangle className="size-3" aria-hidden />Quote not found in transcript — check this one
        </p>
      )}
      {result?.note && status !== 'hit' && <p className="mt-1 ml-6 text-xs text-ink-3">{result.note}</p>}
    </li>
  )
}
