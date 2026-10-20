import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCoachingPlan, buildRepSummaries, type CoachingStep, type RepSummary } from '@/lib/insights/repSummary'
import type { CallListItem, Coaching, RepRef, ResultRow } from '@/lib/types'
import { LIST_COLUMNS, queryCalls, queryResultRows } from './queries'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ID_CHUNK = 100 // keeps the `in.(...)` URL short
const PAGE = 1000 // Supabase max_rows
const MAX_PAGES = 20

export async function loadRepsOverview(): Promise<RepSummary[]> {
  await requireAdmin()
  const [calls, results] = await Promise.all([queryCalls(), queryResultRows()])
  return buildRepSummaries(calls, results)
}

export type RepDetailData = { rep: RepRef; summary: RepSummary | null; plan: CoachingStep[]; calls: CallListItem[] }

/** Results for the given calls: chunked ids, each chunk paged past the 1000-row response cap. */
async function queryResultsForCalls(ids: string[]): Promise<ResultRow[]> {
  const db = createAdminClient()
  const rows: ResultRow[] = []
  for (let i = 0; i < ids.length; i += ID_CHUNK) {
    const chunk = ids.slice(i, i + ID_CHUNK)
    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE
      const { data, error } = await db.from('scorecard_results').select('id,call_id,item_key,status').in('call_id', chunk).order('id').range(from, from + PAGE - 1)
      if (error) throw new Error(error.message)
      const batch = (data ?? []) as unknown as ResultRow[]
      for (const r of batch) rows.push({ call_id: r.call_id, item_key: r.item_key, status: r.status })
      if (batch.length < PAGE) break
    }
  }
  return rows
}

export async function loadRepDetail(id: string): Promise<RepDetailData> {
  await requireAdmin()
  if (!UUID.test(id)) notFound()
  const db = createAdminClient()
  const { data: rep, error: repError } = await db.from('reps').select('id,name').eq('id', id).maybeSingle()
  if (repError) throw new Error(repError.message)
  if (!rep) notFound()
  const { data, error } = await db.from('calls').select(`${LIST_COLUMNS},coaching`).eq('rep_id', id).order('created_at', { ascending: false }).limit(500)
  if (error) throw new Error(error.message)
  const calls = (data ?? []) as unknown as Array<CallListItem & { coaching: Coaching | null }>
  const results = await queryResultsForCalls(calls.map((c) => c.id))
  return { rep, summary: buildRepSummaries(calls, results)[0] ?? null, plan: buildCoachingPlan(calls, results), calls }
}
