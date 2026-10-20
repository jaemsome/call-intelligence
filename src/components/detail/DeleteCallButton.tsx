'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

export function DeleteCallButton({ callId, label }: { callId: string; label: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  function leave(message: string) {
    toast.success(message)
    router.replace('/calls/log')
    router.refresh()
  }

  async function confirm() {
    setBusy(true)
    try {
      const res = await fetch('/api/calls/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId }),
      })
      if (res.status === 404) return leave(`${label} was already deleted`)
      if (!res.ok) {
        setBusy(false)
        toast.error(res.status === 429 ? 'Too many requests. Try again in a moment.' : 'Could not delete the call')
        return
      }
      leave(`${label} deleted`)
    } catch {
      setBusy(false)
      toast.error('Could not delete the call. Check your connection and try again.')
    }
  }

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}><Trash2 className="size-4" aria-hidden />Delete</Button>
      <ConfirmModal open={open} busy={busy} title={`Delete ${label}?`}
        description="This permanently deletes the recording, transcript, scores and coaching for this call. This can't be undone."
        confirmLabel="Delete call" onConfirm={confirm} onCancel={() => setOpen(false)} />
    </>
  )
}
