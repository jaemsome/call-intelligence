'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PhoneCall, Upload } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CallFilters } from '@/components/calls/CallFilters'
import { CallsTable } from '@/components/calls/CallsTable'
import { UploadDrawer } from '@/components/calls/UploadDrawer'
import { useCallStatus } from '@/hooks/useCallStatus'
import { isProcessing } from '@/lib/labels'
import type { CallsLogData } from '@/lib/data/calls'
import { plural } from '@/lib/utils'

export function CallsLogView({ calls, total, reps, filters }: CallsLogData) {
  const router = useRouter()
  const params = useSearchParams()
  const [uploadOpen, setUploadOpen] = useState(params.get('upload') === '1')
  const processingIds = calls.filter((c) => isProcessing(c.status)).map((c) => c.id)
  const live = useCallStatus(processingIds, () => router.refresh())

  const [pending, setPending] = useState(false)

  const upload = <Button onClick={() => setUploadOpen(true)}><Upload className="size-4" aria-hidden />Upload call</Button>

  return (
    <>
      <PageHeader title="Calls" subtitle={`${plural(calls.length, 'call')}${calls.length !== total ? ` of ${total}` : ''}`} actions={upload} />
      {total === 0 ? (
        <EmptyState icon={PhoneCall} title="No calls yet" text="Upload a recording and we'll transcribe it, score it against your scorecard and tell you what to coach." action={upload} />
      ) : (
        <>
          <CallFilters filters={filters} reps={reps} onPendingChange={setPending} />
          <div aria-busy={pending} className={pending ? 'opacity-60 transition-opacity duration-200' : 'transition-opacity duration-200'}>
            {calls.length === 0 ? <p className="py-12 text-center text-sm text-ink-3">No calls match these filters.</p> : <CallsTable calls={calls} live={live} />}
          </div>
        </>
      )}
      <UploadDrawer open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  )
}
