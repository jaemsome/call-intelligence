import type { Tone } from '@/lib/labels'
import { cn } from '@/lib/utils'

export const TONE_BG: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2', accent: 'bg-accent-soft text-accent', good: 'bg-good-soft text-good', warn: 'bg-warn-soft text-warn', bad: 'bg-bad-soft text-bad',
}
export const TONE_TEXT: Record<Tone, string> = { neutral: 'text-ink', accent: 'text-accent', good: 'text-good', warn: 'text-warn', bad: 'text-bad' }

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', TONE_BG[tone], className)}>{children}</span>
}
