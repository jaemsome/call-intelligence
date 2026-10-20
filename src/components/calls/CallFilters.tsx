'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { CALL_TYPE_LABEL, GRADE_LABEL, OUTCOME_LABEL } from '@/lib/labels'
import { CALL_TYPES, GRADES, type RepRef } from '@/lib/types'
import type { CallFilters as Filters } from '@/lib/insights/filterCalls'
import { cn } from '@/lib/utils'

const chip = (active: boolean) =>
  cn('min-h-11 cursor-pointer whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors duration-200', active ? 'border-accent bg-accent-soft font-medium text-accent' : 'border-line bg-surface text-ink-2 hover:text-ink')
const SCORECARD_SHORT = { sales_17: 'Sales', all_calls_12: 'All calls', retention_12: 'Retention' } as const
const select = 'h-11 cursor-pointer rounded-xl border border-line bg-surface px-3 text-sm transition-colors duration-200 hover:bg-surface-2'

export function CallFilters({ filters, reps, onPendingChange }: { filters: Filters; reps: RepRef[]; onPendingChange?: (pending: boolean) => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState(filters.q ?? '')
  const [prevQ, setPrevQ] = useState(filters.q)
  if (filters.q !== prevQ) {
    setPrevQ(filters.q)
    setQ(filters.q ?? '')
  }
  useEffect(() => { onPendingChange?.(pending) }, [pending, onPendingChange])

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [name, value] of Object.entries(changes)) {
      if (value) next.set(name, value)
      else next.delete(name)
    }
    const qs = next.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }
  const set = (name: string, value: string | null) => update({ [name]: value })

  const outcomePart = filters.missed ? `Missed: ${filters.missed.replace(/_/g, ' ')}` : filters.outcome ? (filters.outcome === 'open' ? 'Open leads' : OUTCOME_LABEL[filters.outcome]) : ''
  const clearLabel = [outcomePart, filters.scorecard ? `(${SCORECARD_SHORT[filters.scorecard]} scorecard)` : ''].filter(Boolean).join(' ')

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Call type">
        <button type="button" aria-pressed={!filters.type} className={chip(!filters.type)} onClick={() => set('type', null)}>All</button>
        {CALL_TYPES.map((t) => (
          <button key={t} type="button" aria-pressed={filters.type === t} className={chip(filters.type === t)} onClick={() => set('type', filters.type === t ? null : t)}>{CALL_TYPE_LABEL[t]}</button>
        ))}
      </div>
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <form role="search" className="relative md:w-72" onSubmit={(e) => { e.preventDefault(); set('q', q.trim() || null) }}>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <input type="search" aria-label="Search calls" value={q} maxLength={100} placeholder="Search customer, rep or call"
            onChange={(e) => { setQ(e.target.value); if (e.target.value === '' && filters.q) set('q', null) }}
            className="h-11 w-full rounded-xl border border-line bg-surface pr-9 pl-9 text-base outline-none focus:ring-2 focus:ring-accent md:text-sm" />
          {pending && <Spinner className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-3" />}
        </form>
        <select aria-label="Rep" value={filters.rep ?? ''} onChange={(e) => set('rep', e.target.value || null)} className={select}>
          <option value="">All reps</option>
          {reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select aria-label="Grade" value={filters.grade ?? ''} onChange={(e) => set('grade', e.target.value || null)} className={select}>
          <option value="">All grades</option>
          {GRADES.map((g) => <option key={g} value={g}>{GRADE_LABEL[g]}</option>)}
        </select>
        <button type="button" aria-pressed={Boolean(filters.review)} className={chip(Boolean(filters.review))} onClick={() => set('review', filters.review ? null : '1')}>Needs review</button>
        {(filters.missed || filters.outcome || filters.scorecard) && (
          <button type="button" aria-label={`Clear filter: ${clearLabel}`} className={cn(chip(true), 'inline-flex items-center gap-1')} onClick={() => update({ missed: null, outcome: null, scorecard: null })}>
            {clearLabel} <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
