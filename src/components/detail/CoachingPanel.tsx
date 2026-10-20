'use client'

import { Copy, Lightbulb, ThumbsUp, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardTitle } from '@/components/ui/Card'
import { itemLabel } from '@/lib/scorecards'
import type { Coaching, ScorecardKind } from '@/lib/types'
import { useSeekActions } from './SeekContext'

type Props = { coaching: Coaching; scorecard: ScorecardKind; onLine: (idx: number) => void }

async function copyScript(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Script copied')
  } catch {
    toast.error('Could not copy. Select the text and copy it manually.')
  }
}

function BulletList({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div className="mt-5">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">{icon}{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">{items.map((s, i) => <li key={`${i}-${s}`}>{s}</li>)}</ul>
    </div>
  )
}

export function CoachingPanel({ coaching, scorecard, onLine }: Props) {
  // Actions-only context: no re-render on playback time updates.
  useSeekActions()
  const { fixes, strengths, missed_opportunities: missed } = coaching
  if (!fixes.length && !strengths.length && !missed.length) return null
  return (
    <Card accent>
      <CardTitle hint="Top fixes, written from your own scripts">Coaching</CardTitle>
      {fixes.length > 0 && (
        <ol className="flex flex-col gap-4">
          {fixes.map((f, i) => {
            const label = itemLabel(scorecard, f.item_key)
            return (
              <li key={`${f.item_key}-${i}`} className="rounded-xl bg-surface-2 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Fix {i + 1} · {label}</p>
                <p className="mt-1 text-sm">
                  {f.what_happened}{' '}
                  {f.line != null && (
                    <button type="button" onClick={() => onLine(f.line as number)}
                      className="inline-flex min-h-11 cursor-pointer md:min-h-8 items-center text-accent-ink underline-offset-2 hover:underline">
                      See moment<span className="sr-only"> for {label}</span>
                    </button>
                  )}
                </p>
                <div className="mt-3 flex items-start gap-2 border-l-4 border-l-good pl-3">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-good" aria-hidden />
                  <p className="flex-1 text-sm italic">“{f.say_instead}”</p>
                  <button type="button" aria-label={`Copy suggested script for ${label}`} onClick={() => copyScript(f.say_instead)}
                    className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface hover:text-ink md:size-9">
                    <Copy className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      )}
      <BulletList icon={<ThumbsUp className="size-4 text-good" aria-hidden />} title="What went well" items={strengths} />
      <BulletList icon={<TrendingUp className="size-4 text-warn" aria-hidden />} title="Missed opportunities" items={missed} />
    </Card>
  )
}
