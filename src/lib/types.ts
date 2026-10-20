export type CallStatus = 'uploaded' | 'transcribing' | 'transcribed' | 'classifying' | 'classified' | 'scoring' | 'done' | 'failed'
export type CallType = 'sales' | 'retention' | 'reservice' | 'scheduling' | 'billing' | 'other_service' | 'not_scorable'
export type ScorecardKind = 'sales_17' | 'all_calls_12' | 'retention_12'
export type Direction = 'inbound' | 'outbound' | 'unknown'
export type CallOutcome = 'booked' | 'not_booked' | 'follow_up' | 'saved' | 'cancelled' | 'resolved' | 'unresolved' | 'no_outcome'
export type Grade = 'gold' | 'green' | 'below'
export type Quadrant = 'validation' | 'understand' | 'solve' | 'objections' | 'verify'
export type ItemStatus = 'hit' | 'miss' | 'na'
export type PipelineStep = 'transcribe' | 'classify' | 'score'
export type SpeakerRole = 'rep' | 'customer' | 'unknown'

export const CALL_TYPES: CallType[] = ['sales', 'retention', 'reservice', 'scheduling', 'billing', 'other_service', 'not_scorable']
export const OUTCOMES: CallOutcome[] = ['booked', 'not_booked', 'follow_up', 'saved', 'cancelled', 'resolved', 'unresolved', 'no_outcome']
export const GRADES: Grade[] = ['gold', 'green', 'below']

export type Segment = { idx: number; speaker: number; role: SpeakerRole; start_ms: number; end_ms: number; text: string }

export type CallDetails = {
  pests: string[]
  price_quoted: string | null
  appointment: string | null
  cancel_reason: string | null
  save_offer: string | null
  objections: string[]
  next_step: string | null
  retention_exempt: boolean
  confidence: 'high' | 'medium' | 'low'
}

export type CoachingFix = { item_key: string; what_happened: string; say_instead: string; line: number | null }
export type Coaching = { strengths: string[]; fixes: CoachingFix[]; missed_opportunities: string[] }

export type ScoreItemResult = {
  item_key: string
  quadrant: Quadrant
  status: ItemStatus
  line_idx: number | null
  quote: string | null
  verified: boolean
  note: string
}

export type RepRef = { id: string; name: string }

export type CallListItem = {
  id: string
  label: string
  status: CallStatus
  error: string | null
  failed_step: PipelineStep | null
  call_type: CallType | null
  not_scorable_reason: string | null
  scorecard: ScorecardKind | null
  direction: Direction | null
  customer_name: string | null
  outcome: CallOutcome | null
  summary: string | null
  duration_sec: number | null
  score: number | null
  max_score: number | null
  grade: Grade | null
  needs_review: boolean
  created_at: string
  details: CallDetails | null
  rep: RepRef | null
}

export type CallDetail = CallListItem & {
  coaching: Coaching | null
  ai_provider: string | null
  ai_model: string | null
  prompt_version: string | null
  processed_at: string | null
  status_at: string
  segments: Segment[]
  results: ScoreItemResult[]
}

/** Minimal result row used for insights and filters. */
export type ResultRow = { call_id: string; item_key: string; status: ItemStatus }
