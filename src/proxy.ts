import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    // Fail closed when auth is not configured.
    const p = request.nextUrl.pathname
    if (p.startsWith('/api/') || p === '/login') return Response.json({ error: 'Service not configured' }, { status: 503 })
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { data } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // API routes do their own auth and return JSON errors.
  if (path.startsWith('/api/')) return response

  const redirectTo = (to: string) => {
    const redirect = NextResponse.redirect(new URL(to, request.url))
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
    return redirect
  }
  if (!data.user && path !== '/login') return redirectTo('/login')
  if (data.user && path === '/login') return redirectTo('/calls')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)$).*)'],
}
