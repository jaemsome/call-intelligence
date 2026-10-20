'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'

export type Tab = 'summary' | 'scorecard' | 'transcript'
export const TABS: Array<[Tab, string]> = [['summary', 'Summary'], ['scorecard', 'Scorecard'], ['transcript', 'Transcript']]
export const tabId = (t: Tab) => `tab-${t}`
export const panelId = (t: Tab) => `panel-${t}`

/** Mobile-only tablist (hidden on lg+, where all panels are visible). */
export function DetailTabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const refs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : null
    if (next == null) return
    e.preventDefault()
    const t = TABS[(next + TABS.length) % TABS.length][0]
    onChange(t)
    refs.current[t]?.focus()
  }
  return (
    <div role="tablist" aria-label="Call sections" className="mb-4 grid grid-cols-3 rounded-xl border border-line bg-surface-2 p-1 lg:hidden">
      {TABS.map(([t, label], i) => (
        <button key={t} ref={(el) => { refs.current[t] = el }} id={tabId(t)} role="tab" type="button"
          aria-selected={tab === t} aria-controls={panelId(t)} tabIndex={tab === t ? 0 : -1}
          onClick={() => onChange(t)} onKeyDown={(e) => onKeyDown(e, i)}
          className={cn('min-h-11 cursor-pointer rounded-lg text-sm font-medium transition-colors', tab === t ? 'bg-surface shadow-sm' : 'text-ink-2 hover:text-ink')}>
          {label}
        </button>
      ))}
    </div>
  )
}
