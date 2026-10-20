import { memo } from 'react'
import { cn, formatTimestamp } from '@/lib/utils'

type Props = {
  idx: number
  start: number
  text: string
  isRep: boolean
  who: string
  isActive: boolean
  isFocused: boolean
  /** Evidence item labels joined by '|' (primitive so memo comparison stays cheap). */
  tags: string
  onSeek: (ms: number) => void
}

export const TranscriptRow = memo(function TranscriptRow({ idx, start, text, isRep, who, isActive, isFocused, tags, onSeek }: Props) {
  const labels = tags ? tags.split('|') : []
  const time = formatTimestamp(start)
  return (
    <li
      id={`line-${idx}`}
      aria-current={isActive ? 'true' : undefined}
      className={cn(
        'flex gap-3 border-l-4 px-4 py-2.5 transition-colors md:px-6',
        labels.length > 0 ? 'border-l-accent' : 'border-l-transparent',
        isActive && 'bg-accent-soft/60',
        isFocused && 'ring-2 ring-inset ring-accent',
      )}
    >
      <button
        type="button"
        onClick={() => onSeek(start)}
        aria-label={`Play from ${time}`}
        className="min-h-11 w-12 shrink-0 md:h-7 md:min-h-0 cursor-pointer rounded-md text-xs tabular-nums text-ink-3 hover:bg-surface-2 hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
      >
        {time}
      </button>
      <div className="min-w-0">
        <p className={cn('text-xs font-semibold', isRep ? 'text-accent-ink' : 'text-ink-2')}>{who}</p>
        <p className="text-[15px] leading-relaxed">{text}</p>
        {labels.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {labels.map((t, i) => (
              <span key={`${t}-${i}`} className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-ink">{t}</span>
            ))}
          </div>
        )}
      </div>
    </li>
  )
})
