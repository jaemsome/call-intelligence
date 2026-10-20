import { Suspense } from 'react'
import { SegmentedTabs, type Tab } from '@/components/ui/SegmentedTabs'

const TABS: Tab[] = [
  { label: 'Overview', href: '/calls', exact: true },
  { label: 'Calls', href: '/calls/log', prefixes: ['/calls/log'], pattern: '^/calls/[0-9a-f-]{36}' },
  { label: 'Reps', href: '/calls/reps', prefixes: ['/calls/reps'] },
]

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-3">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <Suspense fallback={null}><SegmentedTabs tabs={TABS} /></Suspense>
    </header>
  )
}
