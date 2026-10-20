import type { AdminClient } from '@/lib/supabase/admin'
import { generateObject, getLlm } from '@/lib/ai/llm'
import { ClassifySchema, PROMPT_VERSION, type Classification } from '@/lib/ai/schemas'
import { CLASSIFY_SYSTEM, classifyPrompt } from '@/lib/ai/prompts/classify'
import { scorecardForCallType } from '@/lib/scorecards'
import { speakerCount } from '@/lib/transcript/format'
import { matchRep, type RepRecord } from '@/lib/reps'
import { coerceOutcome } from '../outcomes'
import { loadSegments, updateCall, type PipelineCall } from '../db'

const titleCase = (s: string) => s.trim().replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const DEFAULT_REASON = 'Not a scorable conversation.'

async function resolveRep(db: AdminClient, name: string | null): Promise<string | null> {
  if (!name?.trim()) return null
  const { data, error: listError } = await db.from('reps').select('id,name,aliases')
  if (listError) throw new Error(listError.message)
  const found = matchRep(name, (data ?? []) as RepRecord[])
  if (found) return found.id
  const display = titleCase(name)
  const { data: created, error } = await db.from('reps').insert({ name: display }).select('id').single()
  if (!error) return created.id
  // Likely a concurrent insert of the same rep — look it up before giving up.
  const { data: again, error: lookupError } = await db.from('reps').select('id').eq('name', display).maybeSingle()
  if (lookupError || !again) throw new Error(error.message)
  return again.id
}

/** Clears stale scoring output from a previous run (re-analyse). */
async function clearScoring(db: AdminClient, callId: string): Promise<void> {
  const { error } = await db.from('scorecard_results').delete().eq('call_id', callId)
  if (error) throw new Error(error.message)
}

const STALE = { score: null, max_score: null, grade: null, coaching: null, needs_review: false }

async function setRoles(db: AdminClient, callId: string, repSpeaker: number | null): Promise<void> {
  const reset = await db.from('transcript_segments').update({ role: 'unknown' }).eq('call_id', callId)
  if (reset.error) throw new Error(reset.error.message)
  if (repSpeaker == null) return
  const rep = await db.from('transcript_segments').update({ role: 'rep' }).eq('call_id', callId).eq('speaker', repSpeaker)
  if (rep.error) throw new Error(rep.error.message)
  const customer = await db.from('transcript_segments').update({ role: 'customer' }).eq('call_id', callId).neq('speaker', repSpeaker)
  if (customer.error) throw new Error(customer.error.message)
}

export async function classifyStep(db: AdminClient, call: PipelineCall): Promise<void> {
  const segments = await loadSegments(db, call.id)
  if (segments.length < 2 || speakerCount(segments) < 2) {
    await clearScoring(db, call.id)
    await updateCall(db, call.id, {
      ...STALE, rep_id: null, rep_speaker: null, direction: null, customer_name: null, details: null,
      call_type: 'not_scorable', not_scorable_reason: 'Only one voice on the recording (voicemail or hang-up).', outcome: 'no_outcome',
      summary: 'Single-speaker recording — nothing to score.', scorecard: null, status: 'done', processed_at: new Date().toISOString(),
    })
    return
  }
  const { data, provider, model } = await generateObject<Classification>({
    system: CLASSIFY_SYSTEM, prompt: classifyPrompt(segments, call.duration_sec), schema: ClassifySchema, schemaName: 'call_classification', maxTokens: 6000,
  }, getLlm({ durationSec: call.duration_sec }))
  const repSpeaker = segments.some((s) => s.speaker === data.rep_speaker) ? data.rep_speaker : null
  await setRoles(db, call.id, repSpeaker)
  await clearScoring(db, call.id)
  const notScorable = data.call_type === 'not_scorable'
  const scorecard = scorecardForCallType(data.call_type)
  await updateCall(db, call.id, {
    call_type: data.call_type,
    not_scorable_reason: notScorable ? data.not_scorable_reason?.trim() || DEFAULT_REASON : null,
    direction: data.direction, customer_name: data.customer_name,
    outcome: coerceOutcome(data.call_type, data.outcome), summary: data.summary,
    details: { ...data.details, confidence: data.confidence }, rep_id: await resolveRep(db, data.rep_name), rep_speaker: repSpeaker,
    scorecard, ...STALE,
    ai_provider: provider, ai_model: model, prompt_version: PROMPT_VERSION,
    status: scorecard ? 'classified' : 'done', processed_at: scorecard ? null : new Date().toISOString(),
  })
}
