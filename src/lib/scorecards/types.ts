import type { Quadrant, ScorecardKind } from '@/lib/types'

export type NaRule = 'no_objections' | 'simple_request' | 'first_offer_accepted' | 'customer_saved'

export type ScorecardItem = {
  key: string
  quadrant: Quadrant
  label: string
  definition: string
  hitWhen: string
  examples: string[]
  naRule?: NaRule
}

export type Scorecard = {
  kind: ScorecardKind
  title: string
  maxScore: number
  thresholds: { gold: number; green: number }
  items: ScorecardItem[]
}
