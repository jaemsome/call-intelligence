import { guard, methodNotAllowed } from '@/lib/apiGuard'
import { getApiLimiter } from '@/lib/ratelimit'
import { createClient } from '@/lib/supabase/server'

export const GET = methodNotAllowed

export async function POST(request: Request) {
  const g = await guard(request, getApiLimiter(), { auth: false })
  if (!g.ok) return g.response
  const supabase = await createClient()
  await supabase.auth.signOut()
  return Response.json({ ok: true })
}
