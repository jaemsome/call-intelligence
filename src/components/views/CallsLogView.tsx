'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PhoneCall } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { CallFilters } from '@/components/calls/CallFilters'
import { CallsTable } from '@/components/calls/CallsTable'
import { UploadCallButton } from '@/components/calls/UploadCallButton'
import { useCallStatus } from '@/hooks/useCallStatus'
import { isProcessing } from '@/lib/labels'
import type { CallsLogData } from '@/lib/data/calls'
import { plural } from '@/lib/utils'

export function CallsLogView({ calls, total, reps, filters }: CallsLogData) {
  const router = useRouter()
  const processingIds = calls.filter((c) => isProcessing(c.status)).map((c) => c.id)
  const live = useCallStatus(processingIds, () => router.refresh())

  const [pending, setPending] = useState(false)

  return (
    <>
      <PageHeader title="Calls" subtitle={`${plural(calls.length, 'call')}${calls.length !== total ? ` of ${total}` : ''}`} actions={total === 0 ? undefined : <UploadCallButton />} />
      {total === 0 ? (
        <EmptyState icon={PhoneCall} title="No calls yet" text="Upload a recording and we'll transcribe it, score it against your scorecard and tell you what to coach." action={<UploadCallButton />} />
      ) : (
        <>
          <CallFilters filters={filters} reps={reps} onPendingChange={setPending} />
          <div aria-busy={pending} className={pending ? 'opacity-60 transition-opacity duration-200' : 'transition-opacity duration-200'}>
            {calls.length === 0 ? <p className="py-12 text-center text-sm text-ink-3">No calls match these filters.</p> : <CallsTable calls={calls} live={live} />}
          </div>
        </>
      )}
    </>
  )
}
