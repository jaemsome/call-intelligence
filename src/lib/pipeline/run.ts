import { createAdminClient, type AdminClient } from '@/lib/supabase/admin'
import type { PipelineStep } from '@/lib/types'
import { loadCall, updateCall, type PipelineCall } from './db'
import { canStart, hasTimeFor, STEP_BUDGET_MS, nextStep, RUNNING, type StartMode } from './nextStep'
import { transcribeStep } from './steps/transcribe'
import { classifyStep } from './steps/classify'
import { scoreStep } from './steps/score'

const STEPS: Record<PipelineStep, (db: AdminClient, call: PipelineCall) => Promise<void>> = {
  transcribe: transcribeStep, classify: classifyStep, score: scoreStep,
}

function sanitize(msg: string): string {
  return msg
    .replace(/https?:\/\/\S+/g, '[url]')
    .replace(/token=\S+/gi, 'token=[redacted]')
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]*/g, '[jwt]')
    .replace(/\b(sk|gsk)-[\w-]+/g, '[key]')
}

/** Atomically claims a call so two clicks can't start two runs. Returns false if it is busy. */
export async function claimRun(db: AdminClient, callId: string, mode: StartMode): Promise<boolean> {
  const call = await loadCall(db, callId)
  if (!call || !canStart(call, mode, new Date())) return false
  const step = mode === 'reanalyse' ? 'classify' : nextStep(call)
  if (!step) return false
  const { data, error } = await db.from('calls')
    .update({ status: RUNNING[step], failed_step: null, error: null, status_at: new Date().toISOString() })
    .eq('id', callId).eq('status', call.status).eq('status_at', call.status_at).select('id')
  if (error) throw new Error(error.message)
  return Boolean(data?.length)
}

/** Moves to the running status only if nobody else changed the call since it was loaded. */
async function takeOver(db: AdminClient, call: PipelineCall, step: PipelineStep): Promise<boolean> {
  const { data, error } = await db.from('calls')
    .update({ status: RUNNING[step], error: null, failed_step: null, status_at: new Date().toISOString() })
    .eq('id', call.id).eq('status', call.status).eq('status_at', call.status_at).select('id')
  if (error) throw new Error(error.message)
  return Boolean(data?.length)
}

/**
 * Runs remaining steps, saving status after each. A failure records the step so a retry resumes there.
 * With `deadlineAt` (epoch ms), stops cleanly before a step that might not finish in time, leaving the
 * call in its resting status (transcribed/classified) so a later `start` continues it.
 */
export async function runPipeline(callId: string, db: AdminClient = createAdminClient(), opts: { deadlineAt?: number } = {}): Promise<void> {
  for (let i = 0; i < 4; i++) {
    const call = await loadCall(db, callId)
    const step = call && nextStep(call)
    if (!call || !step) return
    if (i > 0 && !hasTimeFor(Date.now(), opts.deadlineAt, STEP_BUDGET_MS[step])) return
    try {
      if (i === 0) await updateCall(db, callId, { status: RUNNING[step], error: null, failed_step: null })
      else if (!(await takeOver(db, call, step))) return
      await STEPS[step](db, call)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.error(`[pipeline] ${callId} ${step} failed:`, sanitize(message))
      try {
        await updateCall(db, callId, { status: 'failed', failed_step: step, error: sanitize(message).slice(0, 300) })
      } catch (e2) {
        console.error(`[pipeline] ${callId} could not record failure:`, sanitize(e2 instanceof Error ? e2.message : String(e2)))
      }
      return
    }
  }
}
