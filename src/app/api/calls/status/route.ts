import { z } from 'zod'
import { guard, methodNotAllowed, readJson } from '@/lib/apiGuard'
import { getStatusLimiter } from '@/lib/ratelimit'
import { createAdminClient } from '@/lib/supabase/admin'

export const GET = methodNotAllowed

const Body = z.object({ ids: z.array(z.string().uuid()).min(1).max(50) })

export async function POST(request: Request) {
  const g = await guard(request, getStatusLimiter())
  if (!g.ok) return g.response
  const body = await readJson(request, Body, 4_000)
  if (!body.ok) return body.response
  try {
    const { data, error } = await createAdminClient().from('calls').select('id,status,error,failed_step,status_at').in('id', body.data.ids)
    if (error) throw new Error(error.message)
    return Response.json({ calls: data ?? [] })
  } catch (err) {
    console.error('status failed:', err instanceof Error ? err.message : err)
    return Response.json({ error: 'Could not load status.' }, { status: 500 })
  }
}
