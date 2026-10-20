import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CallDetail, ScoreItemResult, Segment } from '@/lib/types'
import { LIST_COLUMNS } from './queries'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function loadCallDetail(id: string): Promise<CallDetail> {
  await requireAdmin()
  if (!UUID.test(id)) notFound()
  const db = createAdminClient()
  const [call, segments, results] = await Promise.all([
    db.from('calls').select(`${LIST_COLUMNS},coaching,ai_provider,ai_model,prompt_version,processed_at,status_at`).eq('id', id).maybeSingle(),
    db.from('transcript_segments').select('idx,speaker,role,start_ms,end_ms,text').eq('call_id', id).order('idx'),
    db.from('scorecard_results').select('item_key,quadrant,status,line_idx,quote,verified,note').eq('call_id', id).order('item_key'),
  ])
  if (call.error) throw new Error(call.error.message)
  if (segments.error) throw new Error(segments.error.message)
  if (results.error) throw new Error(results.error.message)
  if (!call.data) notFound()
  return {
    ...(call.data as unknown as Omit<CallDetail, 'segments' | 'results'>),
    segments: (segments.data ?? []) as Segment[],
    results: (results.data ?? []) as ScoreItemResult[],
  }
}
