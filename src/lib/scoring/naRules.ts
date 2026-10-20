import type { CallOutcome, CallType } from '@/lib/types'
import type { NaRule } from '@/lib/scorecards'

export type NaContext = { callType: CallType; outcome: CallOutcome | null; objectionsRaised: boolean; retentionExempt: boolean }

/** The only N/A cases the manuals allow. Anything else the model marks N/A becomes a miss. */
export function isNaAllowed(rule: NaRule | undefined, ctx: NaContext): boolean {
  switch (rule) {
    case 'no_objections':
      return !ctx.objectionsRaised
    case 'simple_request':
      return ctx.callType === 'scheduling' || ctx.callType === 'billing'
    case 'first_offer_accepted':
      return ctx.outcome === 'saved' || ctx.retentionExempt
    case 'customer_saved':
      return ctx.outcome === 'saved'
    default:
      return false
  }
}
