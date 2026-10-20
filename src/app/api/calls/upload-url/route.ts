import { z } from 'zod'
import { guard, methodNotAllowed, readJson } from '@/lib/apiGuard'
import { getUploadLimiter } from '@/lib/ratelimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { AUDIO_TYPES, MAX_AUDIO_BYTES, signedUploadUrl, storagePathFor } from '@/lib/storage'
import { labelFromFilename } from '@/lib/utils'

export const GET = methodNotAllowed

const Body = z.object({ fileName: z.string().min(1).max(200), contentType: z.string().max(50), size: z.number().int().positive() })

export async function POST(request: Request) {
  const g = await guard(request, getUploadLimiter())
  if (!g.ok) return g.response
  const body = await readJson(request, Body, 2_000)
  if (!body.ok) return body.response
  const { fileName, contentType, size } = body.data
  if (!AUDIO_TYPES.includes(contentType)) return Response.json({ error: 'Upload an MP3, WAV or M4A recording.' }, { status: 400 })
  if (size > MAX_AUDIO_BYTES) return Response.json({ error: 'Recordings must be 50 MB or smaller.' }, { status: 400 })

  try {
    const db = createAdminClient()
    const callId = crypto.randomUUID()
    const path = storagePathFor(callId, fileName)
    const signedUrl = await signedUploadUrl(db, path)
    // No object exists yet, so a failed insert leaves nothing to clean up.
    const { error } = await db.from('calls').insert({ id: callId, label: labelFromFilename(fileName), storage_path: path, status: 'uploaded' })
    if (error) throw new Error(error.message)
    return Response.json({ callId, signedUrl })
  } catch (err) {
    console.error('upload-url failed:', err instanceof Error ? err.message : err)
    return Response.json({ error: 'Could not start the upload. Please try again.' }, { status: 500 })
  }
}
