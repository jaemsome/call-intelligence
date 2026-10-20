import { requireAdmin } from '@/lib/auth'
import { buildInsights, type Insights } from '@/lib/insights/buildInsights'
import { isProcessing } from '@/lib/labels'
import type { CallListItem } from '@/lib/types'
import { queryCalls, queryResultRows } from './queries'

export type OverviewData = { insights: Insights; attention: CallListItem[]; processing: number; total: number }

const pct = (c: CallListItem) => (c.score as number) / (c.max_score as number)

export async function loadOverview(): Promise<OverviewData> {
  await requireAdmin()
  const [calls, results] = await Promise.all([queryCalls(), queryResultRows()])
  const attention = calls
    .filter((c) => c.status === 'done' && c.score != null && c.max_score && pct(c) < 0.85)
    .sort((a, b) => pct(a) - pct(b))
    .slice(0, 5)
  return { insights: buildInsights(calls, results), attention, processing: calls.filter((c) => isProcessing(c.status)).length, total: calls.length }
}
