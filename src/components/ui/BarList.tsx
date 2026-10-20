import Link from 'next/link'
import type { Tone } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type Bar = { label: string; sublabel?: string; value: number; max: number; display: string; href?: string; tone?: Tone }
const FILL: Record<Tone, string> = { neutral: 'bg-ink-3', accent: 'bg-accent', good: 'bg-good', warn: 'bg-warn', bad: 'bg-bad' }

export function BarList({ bars }: { bars: Bar[] }) {
  return (
    <ul role="list" className="flex flex-col gap-1">
      {bars.map((b) => {
        const width = b.max ? Math.max(4, Math.min(100, (b.value / b.max) * 100)) : 0
        const body = (
          <>
            <div className="mb-1 flex items-start justify-between gap-3 text-sm">
              <span className="min-w-0 break-words font-medium">{b.label}{b.sublabel && <span className="block text-xs font-normal text-ink-3">{b.sublabel}</span>}</span>
              <span className="shrink-0 font-medium tabular-nums text-ink-2">{b.display}</span>
            </div>
            <div aria-hidden className="h-2 overflow-hidden rounded-full bg-line">
              <div className={cn('h-full rounded-full', FILL[b.tone ?? 'accent'])} style={{ width: `${width}%` }} />
            </div>
          </>
        )
        const cls = 'flex min-h-11 flex-col justify-center rounded-lg px-2 py-1'
        return (
          <li key={`${b.label}-${b.sublabel ?? ''}`}>
            {b.href ? <Link href={b.href} className={cn(cls, 'transition-colors hover:bg-surface-2')}>{body}</Link> : <div className={cls}>{body}</div>}
          </li>
        )
      })}
    </ul>
  )
}
