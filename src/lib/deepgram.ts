import { requireEnv } from '@/lib/env'
import type { Utterance } from '@/lib/transcript/format'

export type Transcription = { durationSec: number; utterances: Utterance[] }

type DgUtterance = { start: number; end: number; speaker?: number; transcript: string }

// Never echo the raw body: Deepgram can repeat the signed audio URL (a bearer token).
export function redactSecrets(msg: string, audioUrl: string): string {
  return msg
    .replaceAll(audioUrl, '[url]')
    .replace(/https?:\/\/\S+/g, '[url]')
    .replace(/token=\S+/gi, 'token=[redacted]')
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]*/g, '[jwt]')
}

async function failureMessage(res: Response, audioUrl: string): Promise<string> {
  let detail = ''
  try {
    const body = await res.json()
    const code = typeof body?.err_code === 'string' ? body.err_code : ''
    const msg = typeof body?.err_msg === 'string' ? redactSecrets(body.err_msg, audioUrl) : ''
    detail = [code, msg].filter(Boolean).join(' - ')
  } catch {
    // non-JSON body: status only
  }
  return `Transcription failed (${res.status})${detail ? `: ${detail}` : ''}`.slice(0, 160)
}

export async function transcribeUrl(audioUrl: string): Promise<Transcription> {
  // mip_opt_out keeps customer audio out of Deepgram's model-improvement program.
  const params = new URLSearchParams({
    model: 'nova-3', diarize: 'true', utterances: 'true', smart_format: 'true', punctuate: 'true', mip_opt_out: 'true',
  })
  const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: 'POST',
    headers: { Authorization: `Token ${requireEnv('DEEPGRAM_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: audioUrl }),
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) throw new Error(await failureMessage(res, audioUrl))
  const json = await res.json()
  const utterances: DgUtterance[] = json.results?.utterances ?? []
  return {
    durationSec: Number(json.metadata?.duration ?? 0),
    utterances: utterances.map((u) => ({
      start: Number(u.start),
      end: Number(u.end),
      speaker: Number(u.speaker ?? 0),
      transcript: String(u.transcript ?? ''),
    })),
  }
}
