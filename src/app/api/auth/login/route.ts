import { z } from 'zod'
import { guard, methodNotAllowed, readJson } from '@/lib/apiGuard'
import { getLoginLimiter } from '@/lib/ratelimit'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth'

export const GET = methodNotAllowed

const Body = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) })

export async function POST(request: Request) {
  const g = await guard(request, getLoginLimiter(), { auth: false })
  if (!g.ok) return g.response
  const body = await readJson(request, Body, 1_000)
  if (!body.ok) return body.response

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(body.data)
  if (error || !data.user) return Response.json({ error: 'Invalid email or password' }, { status: 401 })
  if (!(await isAdmin(data.user.id))) {
    await supabase.auth.signOut()
    return Response.json({ error: 'This account does not have access' }, { status: 403 })
  }
  return Response.json({ ok: true })
}
