import type { Tone } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { TONE_TEXT } from './Badge'

export function StatTile({ label, value, hint, tone = 'neutral' }: { label: string; value: string; hint?: string; tone?: Tone }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold tabular-nums md:text-3xl', TONE_TEXT[tone])}>{value}</p>
      {hint && <p className="mt-0.5 line-clamp-2 text-xs text-ink-3">{hint}</p>}
    </div>
  )
}
