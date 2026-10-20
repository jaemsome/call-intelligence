import type { CallType, ScorecardKind } from '@/lib/types'
import type { Scorecard } from './types'
import { SALES_17 } from './sales'
import { ALL_CALLS_12 } from './allCalls'
import { RETENTION_12 } from './retention'

export type { Scorecard, ScorecardItem, NaRule } from './types'

export const SCORECARDS: Record<ScorecardKind, Scorecard> = {
  sales_17: SALES_17,
  all_calls_12: ALL_CALLS_12,
  retention_12: RETENTION_12,
}

export function getScorecard(kind: ScorecardKind): Scorecard {
  return SCORECARDS[kind]
}

export function scorecardForCallType(type: CallType): ScorecardKind | null {
  if (type === 'sales') return 'sales_17'
  if (type === 'retention') return 'retention_12'
  if (type === 'not_scorable') return null
  return 'all_calls_12'
}

export function itemLabel(kind: ScorecardKind, key: string): string {
  return SCORECARDS[kind].items.find((i) => i.key === key)?.label ?? key
}
