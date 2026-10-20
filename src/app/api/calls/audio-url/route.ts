import { z } from 'zod'
import { guard, methodNotAllowed, readJson } from '@/lib/apiGuard'
import { getApiLimiter } from '@/lib/ratelimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { signedReadUrl } from '@/lib/storage'

export const GET = methodNotAllowed

const Body = z.object({ callId: z.string().uuid() })

export async function POST(request: Request) {
  const g = await guard(request, getApiLimiter())
  if (!g.ok) return g.response
  const body = await readJson(request, Body, 500)
  if (!body.ok) return body.response
  try {
    const db = createAdminClient()
    const { data, error } = await db.from('calls').select('storage_path').eq('id', body.data.callId).maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return Response.json({ error: 'Call not found.' }, { status: 404 })
    return Response.json({ url: await signedReadUrl(db, data.storage_path, 600) })
  } catch (err) {
    console.error('audio-url failed:', err instanceof Error ? err.message : err)
    return Response.json({ error: 'Could not load the recording.' }, { status: 500 })
  }
}
