import type { CallOutcome, CallStatus, CallType, Grade, Quadrant } from './types'

export type Tone = 'neutral' | 'accent' | 'good' | 'warn' | 'bad'

export const CALL_TYPE_LABEL: Record<CallType, string> = {
  sales: 'Sales', retention: 'Retention', reservice: 'Re-service', scheduling: 'Scheduling',
  billing: 'Billing', other_service: 'Customer service', not_scorable: 'Not scorable',
}

export const OUTCOME_LABEL: Record<CallOutcome, string> = {
  booked: 'Booked', not_booked: 'Not booked', follow_up: 'Follow-up needed', saved: 'Saved', cancelled: 'Cancelled',
  resolved: 'Resolved', unresolved: 'Unresolved', no_outcome: 'No outcome',
}

export const OUTCOME_TONE: Record<CallOutcome, Tone> = {
  booked: 'good', saved: 'good', resolved: 'good', follow_up: 'warn', unresolved: 'warn',
  not_booked: 'bad', cancelled: 'bad', no_outcome: 'neutral',
}

export const GRADE_LABEL: Record<Grade, string> = { gold: 'Gold', green: 'Green', below: 'Below standard' }
export const GRADE_TONE: Record<Grade, Tone> = { gold: 'accent', green: 'good', below: 'bad' }

export const STATUS_LABEL: Record<CallStatus, string> = {
  uploaded: 'Queued', transcribing: 'Transcribing', transcribed: 'Transcribed', classifying: 'Classifying',
  classified: 'Classified', scoring: 'Scoring', done: 'Done', failed: 'Failed',
}

export const QUADRANT_LABEL: Record<Quadrant, string> = {
  validation: 'Validate', understand: 'Understand', solve: 'Solve', objections: 'Objections', verify: 'Verify',
}

export const isProcessing = (status: CallStatus) => status !== 'done' && status !== 'failed'
