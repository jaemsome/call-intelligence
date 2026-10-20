import { Card, CardTitle } from '@/components/ui/Card'
import type { CallDetail } from '@/lib/types'
import { formatDateFull } from '@/lib/utils'

export function SummaryPanel({ call }: { call: CallDetail }) {
  const d = call.details
  const facts: Array<[string, string | null | undefined]> = [
    ['Customer', call.customer_name], ['Rep', call.rep?.name],
    ['Pests', d?.pests.length ? d.pests.join(', ') : null], ['Price quoted', d?.price_quoted], ['Appointment', d?.appointment],
    ['Cancel reason', d?.cancel_reason], ['Save offer', d?.save_offer],
    ['Objections', d?.objections.length ? d.objections.join('; ') : null], ['Next step', d?.next_step],
  ]
  return (
    <Card>
      <CardTitle>Summary</CardTitle>
      {call.summary && <p className="mb-4 text-[15px] leading-relaxed">{call.summary}</p>}
      {call.call_type === 'not_scorable' && (
        <p className="mb-4 rounded-xl bg-surface-2 p-3 text-sm text-ink-2">Not scored: {call.not_scorable_reason ?? 'not a scorable conversation'}.</p>
      )}
      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        {facts.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">{k}</dt>
            <dd className="mt-0.5 text-sm">{v}</dd>
          </div>
        ))}
      </dl>
      {call.ai_model && (
        <p className="mt-5 border-t border-line pt-3 text-xs text-ink-3">
          Analysed by {call.ai_model} · prompt {call.prompt_version} · {formatDateFull(call.processed_at)}
        </p>
      )}
    </Card>
  )
}
