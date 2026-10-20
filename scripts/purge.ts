import { createAdminClient, type AdminClient } from '../src/lib/supabase/admin'
import { RECORDINGS_BUCKET } from '../src/lib/env'

// Usage: pnpm purge --yes   - deletes ALL recordings and call data (run after the test).
// Keeps admin_users. Prints counts only.
const PAGE = 100
type Entry = { name: string; id: string | null }

async function listAll(db: AdminClient, prefix: string): Promise<Entry[]> {
  const out: Entry[] = []
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await db.storage
      .from(RECORDINGS_BUCKET)
      .list(prefix, { limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' } })
    if (error) throw new Error(`List failed: ${error.message}`)
    out.push(...(data ?? []).map((f) => ({ name: f.name, id: f.id })))
    if (!data || data.length < PAGE) return out
  }
}

async function removePaths(db: AdminClient, paths: string[]): Promise<number> {
  let removed = 0
  for (let i = 0; i < paths.length; i += PAGE) {
    const batch = paths.slice(i, i + PAGE)
    const { error } = await db.storage.from(RECORDINGS_BUCKET).remove(batch)
    if (error) throw new Error(`Remove failed: ${error.message}`)
    removed += batch.length
  }
  return removed
}

async function removeObjects(db: AdminClient): Promise<number> {
  const root = await listAll(db, '')
  // Folders have a null id; root-level files have an id.
  let removed = await removePaths(db, root.filter((e) => e.id !== null).map((e) => e.name))
  for (const folder of root.filter((e) => e.id === null)) {
    const files = await listAll(db, folder.name)
    removed += await removePaths(db, files.map((f) => `${folder.name}/${f.name}`))
  }
  return removed
}

async function wipe(db: AdminClient, table: 'calls' | 'reps'): Promise<number> {
  const { count, error } = await db.from(table).delete({ count: 'exact' }).not('id', 'is', null)
  if (error) throw new Error(`Delete ${table} failed: ${error.message}`)
  return count ?? 0
}

async function main() {
  if (!process.argv.includes('--yes')) {
    throw new Error('This deletes every recording and call. Re-run with --yes to confirm.')
  }
  const db = createAdminClient()
  console.log(`Target project: ${new URL(process.env.SUPABASE_URL ?? '').hostname}`)
  const objects = await removeObjects(db)
  const calls = await wipe(db, 'calls')
  const reps = await wipe(db, 'reps')
  console.log(`Purged ${objects} recording(s), ${calls} call(s) (with transcripts and scores), ${reps} rep(s). admin_users kept.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
