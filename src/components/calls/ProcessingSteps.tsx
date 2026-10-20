import { Check } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import type { CallStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STEPS = ['Upload', 'Transcribe', 'Classify', 'Score'] as const
const ACTIVE: Record<CallStatus, number> = { uploaded: 1, transcribing: 1, transcribed: 2, classifying: 2, classified: 3, scoring: 3, done: 4, failed: -1 }

export function ProcessingSteps({ status, uploading = false }: { status: CallStatus | null; uploading?: boolean }) {
  const active = uploading || !status ? 0 : ACTIVE[status]
  return (
    <ol className="flex flex-col gap-3" aria-label="Processing progress">
      {STEPS.map((label, i) => {
        const done = active > i
        const current = active === i
        return (
          <li key={label} aria-current={current ? 'step' : undefined} className="flex min-h-11 items-center gap-3 text-sm">
            <span className={cn('flex size-7 items-center justify-center rounded-full border', done ? 'border-good bg-good text-white' : current ? 'border-accent text-accent' : 'border-line text-ink-3')}>
              {done ? <Check className="size-4" aria-hidden /> : current ? <Spinner className="size-3.5" /> : i + 1}
            </span>
            <span className={cn(done || current ? 'text-ink' : 'text-ink-3')}>
              {label}{current ? '…' : ''}
              <span className="sr-only">{done ? ' (complete)' : current ? ' (in progress)' : ' (waiting)'}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
