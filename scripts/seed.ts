import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { createAdminClient } from '../src/lib/supabase/admin'
import { RECORDINGS_BUCKET } from '../src/lib/env'
import { storagePathFor } from '../src/lib/storage'
import { labelFromFilename } from '../src/lib/utils'
import { claimRun, runPipeline } from '../src/lib/pipeline/run'

// Usage: pnpm seed [--limit N] [--reanalyse]
// Runs the SAME pipeline the app uses, one call at a time. Never prints transcript text,
// customer names or signed URLs - only labels, statuses, call types and scores.
const CONTENT_TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
}

function parseLimit(): number {
  const idx = process.argv.indexOf('--limit')
  if (idx === -1) return Infinity
  const n = Number(process.argv[idx + 1])
  if (!Number.isInteger(n) || n < 1) throw new Error('--limit needs a positive integer')
  return n
}

async function main() {
  const dir = process.env.SEED_AUDIO_DIR
  if (!dir) throw new Error('Set SEED_AUDIO_DIR in .env.local')
  const limit = parseLimit()
  const reanalyse = process.argv.includes('--reanalyse')
  // --limit applies to the file list before the done-skip, so skipped calls count toward it.
  const seen = new Set<string>()
  const files = (await readdir(dir)).filter((f) => /\.(mp3|wav|m4a)$/i.test(f)).sort().slice(0, limit)
  const db = createAdminClient()

  for (const file of files) {
    const label = labelFromFilename(file)
    if (seen.has(label)) {
      console.warn(`warn  duplicate label ${label}, skipping second file`)
      continue
    }
    seen.add(label)
    const { data: rows, error: findErr } = await db
      .from('calls')
      .select('id,status')
      .eq('label', label)
      .order('created_at', { ascending: false })
      .limit(5)
    if (findErr) throw new Error(`Lookup failed for ${label}: ${findErr.message}`)
    const existing = rows?.find((r) => r.status === 'done') ?? rows?.[0]
    if (existing && ['transcribing', 'classifying', 'scoring'].includes(existing.status)) {
      console.warn(`warn  ${label} is in status ${existing.status}; another run may be active`)
    }

    let id = existing?.id as string | undefined
    if (existing?.status === 'done') {
      if (!reanalyse) {
        console.log(`skip  ${label} (done)`)
        continue
      }
      const claimed = await claimRun(db, existing.id, 'reanalyse')
      if (!claimed) {
        console.log(`skip  ${label} (could not claim for re-analysis)`)
        continue
      }
    } else if (existing && existing.status !== 'done') {
      const claimed = await claimRun(db, existing.id, 'start')
      if (!claimed) {
        console.log(`skip  ${label} (${existing.status}; could not claim)`)
        continue
      }
    }
    if (!id) {
      id = crypto.randomUUID()
      const storagePath = storagePathFor(id, file)
      const ext = path.extname(file).slice(1).toLowerCase()
      const bytes = await readFile(path.join(dir, file))
      const { error: upErr } = await db.storage
        .from(RECORDINGS_BUCKET)
        .upload(storagePath, bytes, { contentType: CONTENT_TYPES[ext] ?? 'audio/mpeg' })
      if (upErr) throw new Error(`Upload failed for ${label}: ${upErr.message}`)
      const { error: insErr } = await db
        .from('calls')
        .insert({ id, label, storage_path: storagePath, status: 'uploaded' })
      if (insErr) {
        await db.storage.from(RECORDINGS_BUCKET).remove([storagePath]) // best effort cleanup
        throw new Error(`Insert failed for ${label}: ${insErr.message}`)
      }
    }

    const started = Date.now()
    await runPipeline(id, db)
    const { data: after, error: readErr } = await db
      .from('calls')
      .select('status,call_type,score,max_score,grade,error')
      .eq('id', id)
      .single()
    if (readErr || !after) throw new Error(`Read-back failed for ${label}: ${readErr?.message ?? 'no row'}`)
    const secs = Math.round((Date.now() - started) / 1000)
    const err = after.error ? ` ${String(after.error).replace(/https?:\/\/\S+/g, '[url]').slice(0, 160)}` : ''
    console.log(
      `${String(after.status).padEnd(6)} ${label}  ${after.call_type ?? '-'}  ${after.score ?? '-'}/${after.max_score ?? '-'} ${after.grade ?? ''}${err} (${secs}s)`,
    )
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
