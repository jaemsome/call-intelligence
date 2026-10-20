'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export type Tab = { label: string; href: string; exact?: boolean; prefixes?: string[]; pattern?: string }

function isActive(t: Tab, path: string) {
  if (t.exact && path === t.href) return true
  if (t.prefixes?.some((p) => path.startsWith(p))) return true
  return t.pattern ? new RegExp(t.pattern).test(path) : false
}

export function SegmentedTabs({ tabs }: { tabs: Tab[] }) {
  const path = usePathname()
  return (
    <nav aria-label="Sections" className="inline-flex rounded-xl border border-line bg-surface-2 p-1">
      {tabs.map((t) => {
        const active = isActive(t, path)
        return (
          <Link key={t.href} href={t.href} aria-current={active ? 'page' : undefined}
            className={cn('flex min-h-11 items-center rounded-lg px-4 text-sm font-medium transition-colors',
              active ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink')}>
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
