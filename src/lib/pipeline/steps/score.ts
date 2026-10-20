import type { AdminClient } from '@/lib/supabase/admin'
import { generateObject, getLlm } from '@/lib/ai/llm'
import { ScoreSchema, PROMPT_VERSION, type ScoreOutput } from '@/lib/ai/schemas'
import { scorePrompt, scoreSystem } from '@/lib/ai/prompts/score'
import { getScorecard, type Scorecard } from '@/lib/scorecards'
import { finalizeScore } from '@/lib/scoring/finalize'
import type { Coaching } from '@/lib/types'
import { loadSegments, updateCall, type PipelineCall } from '../db'

function cleanCoaching(c: ScoreOutput['coaching'], sc: Scorecard): Coaching {
  const keys = new Set(sc.items.map((i) => i.key))
  return {
    strengths: c.strengths.slice(0, 3),
    fixes: c.fixes.filter((f) => keys.has(f.item_key)).slice(0, 3),
    missed_opportunities: c.missed_opportunities.slice(0, 3),
  }
}

export async function scoreStep(db: AdminClient, call: PipelineCall): Promise<void> {
  if (!call.scorecard || !call.call_type) throw new Error('Call has no scorecard — classify it first.')
  const sc = getScorecard(call.scorecard)
  const segments = await loadSegments(db, call.id)
  const { data, provider, model } = await generateObject<ScoreOutput>({
    system: scoreSystem(sc), prompt: scorePrompt({ call_type: call.call_type, outcome: call.outcome, summary: call.summary }, segments),
    schema: ScoreSchema, schemaName: 'call_score', maxTokens: 12000,
  }, getLlm({ durationSec: call.duration_sec }))
  const fin = finalizeScore({
    scorecard: sc, items: data.items, segments,
    ctx: {
      callType: call.call_type, outcome: call.outcome, objectionsRaised: data.objections_raised,
      retentionExempt: call.details?.retention_exempt ?? false, solutionHasCost: data.solution_has_cost,
      lowConfidence: call.details?.confidence === 'low' || call.rep_speaker == null,
    },
  })
  const { error: delError } = await db.from('scorecard_results').delete().eq('call_id', call.id)
  if (delError) throw new Error(delError.message)
  const { error } = await db.from('scorecard_results').insert(fin.items.map((i) => ({ ...i, call_id: call.id })))
  if (error) throw new Error(error.message)
  await updateCall(db, call.id, {
    score: fin.score, max_score: fin.maxScore, grade: fin.grade, needs_review: fin.needsReview, coaching: cleanCoaching(data.coaching, sc),
    ai_provider: provider, ai_model: model, prompt_version: PROMPT_VERSION, status: 'done', processed_at: new Date().toISOString(),
  })
}
