import type { AdminClient } from '@/lib/supabase/admin'
import type { CallDetails, CallOutcome, CallStatus, CallType, PipelineStep, ScorecardKind, Segment } from '@/lib/types'

export type PipelineCall = {
  id: string; storage_path: string; duration_sec: number | null; status: CallStatus; status_at: string
  failed_step: PipelineStep | null; call_type: CallType | null; scorecard: ScorecardKind | null
  outcome: CallOutcome | null; summary: string | null; details: CallDetails | null; rep_speaker: number | null
}

const CALL_COLUMNS = 'id,storage_path,duration_sec,status,status_at,failed_step,call_type,scorecard,outcome,summary,details,rep_speaker'

export async function loadCall(db: AdminClient, id: string): Promise<PipelineCall | null> {
  const { data, error } = await db.from('calls').select(CALL_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data as PipelineCall | null
}

export async function loadSegments(db: AdminClient, callId: string): Promise<Segment[]> {
  const { data, error } = await db.from('transcript_segments').select('idx,speaker,role,start_ms,end_ms,text').eq('call_id', callId).order('idx')
  if (error) throw new Error(error.message)
  return (data ?? []) as Segment[]
}

export async function updateCall(db: AdminClient, id: string, patch: Record<string, unknown>): Promise<void> {
  const withTime = 'status' in patch ? { ...patch, status_at: new Date().toISOString() } : patch
  const { error } = await db.from('calls').update(withTime).eq('id', id)
  if (error) throw new Error(error.message)
}
