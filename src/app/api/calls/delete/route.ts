import { z } from 'zod'
import { guard, methodNotAllowed, readJson } from '@/lib/apiGuard'
import { getDeleteLimiter } from '@/lib/ratelimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { RECORDINGS_BUCKET } from '@/lib/env'

export const GET = methodNotAllowed

const Body = z.object({ callId: z.string().uuid() })

export async function POST(request: Request) {
  const g = await guard(request, getDeleteLimiter())
  if (!g.ok) return g.response
  const body = await readJson(request, Body, 500)
  if (!body.ok) return body.response
  try {
    const db = createAdminClient()
    const { data, error: findError } = await db.from('calls').select('storage_path').eq('id', body.data.callId).maybeSingle()
    if (findError) throw new Error(findError.message)
    if (!data) return Response.json({ error: 'Call not found.' }, { status: 404 })
    try {
      const { error } = await db.storage.from(RECORDINGS_BUCKET).remove([data.storage_path])
      if (error) console.error('delete: storage remove failed:', data.storage_path, error.message)
    } catch (err) {
      console.error('delete: storage remove threw:', err instanceof Error ? err.message : err)
    }
    // Delete the row regardless so the user is never stuck with an undeletable call (cascades segments/results).
    const { error } = await db.from('calls').delete().eq('id', body.data.callId)
    if (error) throw new Error(error.message)
    return Response.json({ ok: true })
  } catch (err) {
    console.error('delete failed:', err instanceof Error ? err.message : err)
    return Response.json({ error: 'Could not delete the call.' }, { status: 500 })
  }
}
