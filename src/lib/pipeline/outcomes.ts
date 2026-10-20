import type { CallOutcome, CallType } from '@/lib/types'

const ALLOWED: Record<Exclude<CallType, 'not_scorable'>, CallOutcome[]> = {
  sales: ['booked', 'not_booked', 'follow_up'],
  retention: ['saved', 'cancelled', 'follow_up'],
  reservice: ['resolved', 'unresolved', 'follow_up'],
  scheduling: ['resolved', 'unresolved', 'follow_up'],
  billing: ['resolved', 'unresolved', 'follow_up'],
  other_service: ['resolved', 'unresolved', 'follow_up'],
}

/** Forces the model's outcome to one valid for the call type; invalid values become follow_up. */
export function coerceOutcome(callType: CallType, outcome: CallOutcome): CallOutcome {
  if (callType === 'not_scorable') return 'no_outcome'
  return ALLOWED[callType].includes(outcome) ? outcome : 'follow_up'
}
