'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'

export function RetryButton({ callId, mode = 'start', label = 'Retry', className }: { callId: string; mode?: 'start' | 'reanalyse'; label?: string; className?: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function run() {
    setBusy(true)
    try {
      const res = await fetch('/api/calls/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callId, mode }) })
      if (!res.ok) {
        toast.error((await res.json().catch(() => ({}))).error ?? 'Could not start processing')
        return
      }
      toast.success(mode === 'reanalyse' ? 'Re-analysing call…' : 'Processing restarted')
      router.refresh()
    } catch {
      toast.error('Could not reach the server. Try again.')
    } finally {
      setBusy(false)
    }
  }
  return <Button variant="secondary" className={className} onClick={run} loading={busy} loadingLabel="Starting…">{label}</Button>
}
