import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonClasses } from '@/components/ui/Button'
import type { Leak } from '@/lib/insights/buildInsights'
import { cn } from '@/lib/utils'

export function LeakCard({ leak }: { leak: Leak }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-2 p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-medium">
          <span aria-hidden className={cn('size-2 shrink-0 rounded-full', leak.tone === 'bad' ? 'bg-bad' : 'bg-warn')} />
          {leak.title}
        </p>
        <p className="mt-0.5 text-sm text-ink-3">{leak.detail}</p>
      </div>
      <Link href={leak.href} aria-label={`${leak.actionLabel}: ${leak.title}`} className={buttonClasses('primary', 'w-full shrink-0 justify-center md:w-auto')}>
        {leak.actionLabel}<ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  )
}
