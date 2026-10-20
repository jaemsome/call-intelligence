import { requireAdmin } from '@/lib/auth'
import { filterCalls, parseFilters, type CallFilters } from '@/lib/insights/filterCalls'
import type { CallListItem, RepRef } from '@/lib/types'
import { queryCalls, queryReps, queryResultRows } from './queries'

export type CallsLogData = { calls: CallListItem[]; total: number; reps: RepRef[]; filters: CallFilters }

export async function loadCallsLog(params: Record<string, string | string[] | undefined>): Promise<CallsLogData> {
  await requireAdmin()
  const [calls, results, reps] = await Promise.all([queryCalls(), queryResultRows(), queryReps()])
  const filters = parseFilters(params)
  return { calls: filterCalls(calls, results, filters), total: calls.length, reps, filters }
}
