import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminUser = { id: string; email: string }

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await createAdminClient().from('admin_users').select('user_id').eq('user_id', userId).maybeSingle()
  return Boolean(data)
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user || !(await isAdmin(data.user.id))) return null
  return { id: data.user.id, email: data.user.email ?? '' }
}

/** For server components and loaders: bounce to /login when not an admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser()
  if (!user) redirect('/login')
  return user
}
