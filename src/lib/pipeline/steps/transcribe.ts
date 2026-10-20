import type { AdminClient } from '@/lib/supabase/admin'
import { transcribeUrl } from '@/lib/deepgram'
import { signedReadUrl } from '@/lib/storage'
import { segmentsFromUtterances } from '@/lib/transcript/format'
import { updateCall, type PipelineCall } from '../db'

const MAX_SECONDS = 30 * 60

export async function transcribeStep(db: AdminClient, call: PipelineCall): Promise<void> {
  const url = await signedReadUrl(db, call.storage_path, 600)
  const result = await transcribeUrl(url)
  if (result.durationSec > MAX_SECONDS) throw new Error('Recording is longer than 30 minutes.')
  const segments = segmentsFromUtterances(result.utterances)

  const { error: delError } = await db.from('transcript_segments').delete().eq('call_id', call.id)
  if (delError) throw new Error(delError.message)
  // Zero utterances is valid (silence): classify marks it not_scorable via the speaker-count rule.
  if (segments.length) {
    const { error } = await db.from('transcript_segments').insert(segments.map((s) => ({ ...s, call_id: call.id })))
    if (error) throw new Error(error.message)
  }
  await updateCall(db, call.id, { duration_sec: Math.round(result.durationSec), status: 'transcribed' })
}
