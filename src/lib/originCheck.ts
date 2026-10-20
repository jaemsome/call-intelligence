export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true // non-browser (server-to-server) call
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export function forbiddenOriginResponse(): Response {
  return Response.json({ error: 'Forbidden origin' }, { status: 403 })
}
