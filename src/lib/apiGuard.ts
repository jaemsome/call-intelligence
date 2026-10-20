import type { ZodType } from 'zod'
import { isAllowedOrigin, forbiddenOriginResponse } from '@/lib/originCheck'
import { getAdminUser, type AdminUser } from '@/lib/auth'
import type { Limiter } from '@/lib/ratelimit'

export type GuardResult = { ok: true; user: AdminUser | null } | { ok: false; response: Response }
export type BodyResult<T> = { ok: true; data: T } | { ok: false; response: Response }

export function methodNotAllowed(): Response {
  return Response.json({ error: 'Method Not Allowed' }, { status: 405, headers: { Allow: 'POST' } })
}

export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
}

/** Origin check → rate limit → (optional) admin session check. Always the first call in a route. */
export async function guard(request: Request, limiter: Limiter, opts: { auth: boolean } = { auth: true }): Promise<GuardResult> {
  if (!isAllowedOrigin(request)) return { ok: false, response: forbiddenOriginResponse() }
  const { success } = await limiter.limit(clientIp(request))
  if (!success) return { ok: false, response: Response.json({ error: 'Too many requests' }, { status: 429 }) }
  if (!opts.auth) return { ok: true, user: null }
  const user = await getAdminUser()
  if (!user) return { ok: false, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  return { ok: true, user }
}

/** Reads, size-caps and validates a JSON body. */
export async function readJson<T>(request: Request, schema: ZodType<T>, maxBytes = 10_000): Promise<BodyResult<T>> {
  const text = await request.text()
  if (text.length > maxBytes) return { ok: false, response: Response.json({ error: 'Request too large' }, { status: 413 }) }
  let raw: unknown
  try {
    raw = JSON.parse(text || '{}')
  } catch {
    return { ok: false, response: Response.json({ error: 'Invalid JSON' }, { status: 400 }) }
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { ok: false, response: Response.json({ error: 'Invalid request' }, { status: 400 }) }
  return { ok: true, data: parsed.data }
}
