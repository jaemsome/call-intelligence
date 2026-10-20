import { createAdminClient } from '@/lib/supabase/admin'
import type { CallListItem, RepRef, ResultRow } from '@/lib/types'

/**
 * Raw queries. Callers MUST have already run `requireAdmin()`.
 * `rep:reps(id,name)` is a many-to-one embed (calls.rep_id -> reps.id), so PostgREST returns a single object
 * (or null), matching `CallListItem.rep`; the generated select type is looser, hence the casts via `unknown`.
 */
export const LIST_COLUMNS =
  'id,label,status,error,failed_step,call_type,not_scorable_reason,scorecard,direction,customer_name,outcome,summary,duration_sec,score,max_score,grade,needs_review,created_at,details,rep:reps(id,name)'

export async function queryCalls(filter?: { repId?: string }): Promise<CallListItem[]> {
  // V1 scope: the log, filters and insights cover the 500 newest calls. 500 < default max_rows (1000), so no silent truncation.
  let q = createAdminClient().from('calls').select(LIST_COLUMNS).order('created_at', { ascending: false }).limit(500)
  if (filter?.repId) q = q.eq('rep_id', filter.repId)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as CallListItem[]
}

const PAGE = 1000
const MAX_PAGES = 20

/** Pages through results (Supabase caps a single response at max_rows, default 1000); safety stop at 20,000 rows. */
export async function queryResultRows(): Promise<ResultRow[]> {
  const db = createAdminClient()
  const rows: ResultRow[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE
    const { data, error } = await db.from('scorecard_results').select('id,call_id,item_key,status').order('id').range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    const batch = (data ?? []) as unknown as (ResultRow & { id: number })[]
    for (const r of batch) rows.push({ call_id: r.call_id, item_key: r.item_key, status: r.status })
    if (batch.length < PAGE) break
  }
  return rows
}

export async function queryReps(): Promise<RepRef[]> {
  const { data, error } = await createAdminClient().from('reps').select('id,name').order('name')
  if (error) throw new Error(error.message)
  return (data ?? []) as RepRef[]
}
