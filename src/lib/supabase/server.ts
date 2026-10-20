import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { connection } from 'next/server'
import { requireEnv } from '@/lib/env'

export async function createClient() {
  // Session checks read the clock (token expiry), so they must run per request, never at prerender.
  await connection()
  const cookieStore = await cookies()
  return createServerClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component; proxy.ts refreshes the session instead.
        }
      },
    },
  })
}
