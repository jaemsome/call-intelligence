import { z } from 'zod'
import { CALL_TYPES, OUTCOMES } from '@/lib/types'

export const PROMPT_VERSION = 'v1'

export const ClassifySchema = z.object({
  call_type: z.enum(CALL_TYPES),
  not_scorable_reason: z.string().nullable(),
  rep_speaker: z.number().int().nullable(),
  rep_name: z.string().nullable(),
  customer_name: z.string().nullable(),
  direction: z.enum(['inbound', 'outbound', 'unknown']),
  outcome: z.enum(OUTCOMES),
  summary: z.string(),
  details: z.object({
    pests: z.array(z.string()),
    price_quoted: z.string().nullable(),
    appointment: z.string().nullable(),
    cancel_reason: z.string().nullable(),
    save_offer: z.string().nullable(),
    objections: z.array(z.string()),
    next_step: z.string().nullable(),
    retention_exempt: z.boolean(),
  }),
  confidence: z.enum(['high', 'medium', 'low']),
})
export type Classification = z.infer<typeof ClassifySchema>

export const ScoreSchema = z.object({
  items: z.array(z.object({
    key: z.string(),
    status: z.enum(['hit', 'miss', 'na']),
    line: z.number().int().nullable(),
    quote: z.string().nullable(),
    note: z.string(),
  })),
  objections_raised: z.boolean(),
  solution_has_cost: z.boolean(),
  coaching: z.object({
    strengths: z.array(z.string()),
    fixes: z.array(z.object({ item_key: z.string(), what_happened: z.string(), say_instead: z.string(), line: z.number().int().nullable() })),
    missed_opportunities: z.array(z.string()),
  }),
})
export type ScoreOutput = z.infer<typeof ScoreSchema>
