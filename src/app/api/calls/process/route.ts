import { after } from 'next/server'
import { z } from 'zod'
import { guard, methodNotAllowed, readJson } from '@/lib/apiGuard'
import { getProcessLimiter } from '@/lib/ratelimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { claimRun, runPipeline } from '@/lib/pipeline/run'
import { ABANDONED_MS } from '@/lib/pipeline/nextStep'
import { RECORDINGS_BUCKET } from '@/lib/env'

export const maxDuration = 300
export const GET = methodNotAllowed

const ABANDONED_MSG = "Upload didn't finish — please upload again."

const Body = z.object({ callId: z.string().uuid(), mode: z.enum(['start', 'reanalyse']).default('start') })

export async function POST(request: Request) {
  const g = await guard(request, getProcessLimiter())
  if (!g.ok) return g.response
  const body = await readJson(request, Body, 500)
  if (!body.ok) return body.response
  const { callId, mode } = body.data

  const deadlineAt = Date.now() + 285_000
  let claimed: boolean
  let db: ReturnType<typeof createAdminClient>
  try {
    db = createAdminClient()
    const { data: call, error: findError } = await db.from('calls').select('status,status_at').eq('id', callId).maybeSingle()
    if (findError) throw new Error(findError.message)
    if (!call) return Response.json({ error: 'Call not found.' }, { status: 404 })
    if (call.status === 'uploaded') {
      const { data: files, error: listError } = await db.storage.from(RECORDINGS_BUCKET).list(callId, { limit: 1 })
      if (listError) throw new Error(listError.message)
      if (!files?.length) {
        if (Date.now() - new Date(call.status_at).getTime() > ABANDONED_MS) {
          const { error: failError } = await db.from('calls')
            .update({ status: 'failed', failed_step: 'transcribe', error: ABANDONED_MSG, status_at: new Date().toISOString() })
            .eq('id', callId).eq('status', 'uploaded').eq('status_at', call.status_at)
          if (failError) throw new Error(failError.message)
          return Response.json({ error: ABANDONED_MSG }, { status: 409 })
        }
        return Response.json({ error: 'Upload not finished yet.' }, { status: 409 })
      }
    }
    claimed = await claimRun(db, callId, mode)
  } catch (err) {
    console.error('process claim failed:', err instanceof Error ? err.message : err)
    return Response.json({ error: 'Could not start processing. Please try again.' }, { status: 500 })
  }
  if (!claimed) {
    return Response.json({ error: 'This call is already processing or cannot be started right now.' }, { status: 409 })
  }
  after(() => runPipeline(callId, db, { deadlineAt }).catch((e) => console.error('[process] pipeline crashed:', e instanceof Error ? e.message : e)))
  return Response.json({ ok: true }, { status: 202 })
}
