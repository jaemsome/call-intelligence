import type { AdminClient } from '@/lib/supabase/admin'
import { RECORDINGS_BUCKET } from '@/lib/env'

export const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/m4a']
export const MAX_AUDIO_BYTES = 50 * 1024 * 1024

export function storagePathFor(callId: string, fileName: string): string {
  const cleaned = fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-100).replace(/^\.+/, '')
  const safe = /[a-zA-Z0-9]/.test(cleaned) ? cleaned : 'recording.mp3'
  return `${callId}/${safe}`
}

export async function signedReadUrl(db: AdminClient, path: string, seconds = 600): Promise<string> {
  const { data, error } = await db.storage.from(RECORDINGS_BUCKET).createSignedUrl(path, seconds)
  if (error || !data) throw new Error(`Could not sign audio URL: ${error?.message ?? 'unknown'}`)
  return data.signedUrl
}

export async function signedUploadUrl(db: AdminClient, path: string): Promise<string> {
  const { data, error } = await db.storage.from(RECORDINGS_BUCKET).createSignedUploadUrl(path)
  if (error || !data) throw new Error(`Could not create upload URL: ${error?.message ?? 'unknown'}`)
  return data.signedUrl
}
