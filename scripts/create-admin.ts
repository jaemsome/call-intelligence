import { createAdminClient } from '../src/lib/supabase/admin'

// Usage: pnpm create-admin <email> <password>
async function main() {
  const [email, password] = process.argv.slice(2)
  if (!email || !password || password.length < 8) {
    throw new Error('Usage: pnpm create-admin <email> <password (8+ chars)>')
  }
  const db = createAdminClient()
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) throw error ?? new Error('User not created')
  const { error: insertError } = await db.from('admin_users').insert({ user_id: data.user.id, email })
  if (insertError) throw insertError
  console.log(`Admin created: ${email}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
