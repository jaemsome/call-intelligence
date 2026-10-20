'use client'

import { useCallback, useRef, useState } from 'react'

// Mirrors AUDIO_TYPES / MAX_AUDIO_BYTES in src/lib/storage.ts (server-only, so duplicated here).
const TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/m4a']
const MAX = 50 * 1024 * 1024
const BY_EXTENSION: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4' }
const NOT_READY = 'Upload not finished yet.'
const START_RETRIES = 3
const START_DELAY_MS = 1000

export type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; name: string }
  | { phase: 'processing'; name: string; callId: string }
  | { phase: 'error'; message: string; name?: string; callId?: string }

export type AudioCheck = { ok: true; contentType: string } | { ok: false; message: string }

/** Validates size and type; infers the MIME type from the extension when the browser's is empty or unexpected. */
export function validateAudio(file: Pick<File, 'name' | 'type' | 'size'>): AudioCheck {
  let contentType = file.type
  if (!TYPES.includes(contentType)) {
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
    const inferred = BY_EXTENSION[ext]
    if (!inferred) return { ok: false, message: 'Upload an MP3, WAV or M4A recording.' }
    contentType = inferred
  }
  if (file.size > MAX) return { ok: false, message: 'Recordings must be 50 MB or smaller.' }
  return { ok: true, contentType }
}

async function post(url: string, body: unknown): Promise<{ ok: boolean; status: number; json: { error?: string; [k: string]: unknown } }> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, json }
}

/** Starts (or resumes) processing; retries briefly while storage hasn't made the object visible yet. */
export async function startProcessing(callId: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    const { ok, status, json } = await post('/api/calls/process', { callId, mode: 'start' })
    if (ok) return
    if (status === 409 && json.error === NOT_READY && attempt < START_RETRIES) {
      await new Promise((r) => setTimeout(r, START_DELAY_MS))
      continue
    }
    throw new Error(json.error ?? 'Something went wrong')
  }
}

const messageOf = (e: unknown) => (e instanceof Error ? e.message : 'Upload failed. Please try again.')

export function useUpload() {
  const [state, setState] = useState<UploadState>({ phase: 'idle' })
  const busy = useRef(false) // guards against a double drop starting two uploads

  const upload = useCallback(async (file: File) => {
    if (busy.current) return
    const check = validateAudio(file)
    if (!check.ok) return setState({ phase: 'error', message: check.message })
    busy.current = true
    setState({ phase: 'uploading', name: file.name })
    let callId: string | undefined
    try {
      const created = await post('/api/calls/upload-url', { fileName: file.name, contentType: check.contentType, size: file.size })
      if (!created.ok) throw new Error(created.json.error ?? 'Something went wrong')
      const { signedUrl } = created.json as { callId: string; signedUrl: string }
      callId = created.json.callId as string
      // Same shape supabase-js uses for uploadToSignedUrl: PUT multipart with the file.
      const form = new FormData()
      form.append('cacheControl', '3600')
      form.append('', new File([file], file.name, { type: check.contentType }))
      let put: Response | null = null
      try {
        put = await fetch(signedUrl, { method: 'PUT', body: form, headers: { 'x-upsert': 'false' } })
      } catch {
        put = null
      }
      if (!put?.ok) {
        await post('/api/calls/delete', { callId }).catch(() => null) // best effort: no orphan 'uploaded' row
        throw new Error('Upload failed. Please try again.')
      }
      await startProcessing(callId)
      setState({ phase: 'processing', name: file.name, callId })
    } catch (e) {
      setState({ phase: 'error', message: messageOf(e), name: file.name })
    } finally {
      busy.current = false
    }
  }, [])

  /** Calls process again for an existing call (e.g. after a failed run). Throws on failure. */
  const restart = useCallback(async (callId: string) => {
    await startProcessing(callId)
  }, [])

  const reset = useCallback(() => setState({ phase: 'idle' }), [])
  return { state, upload, restart, reset }
}
