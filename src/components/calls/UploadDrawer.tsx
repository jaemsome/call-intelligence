'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonClasses } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useUpload } from '@/hooks/useUpload'
import { useCallStatus } from '@/hooks/useCallStatus'
import { Dropzone } from './Dropzone'
import { ProcessingSteps } from './ProcessingSteps'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),[tabindex]:not([tabindex="-1"])'

export function UploadDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const toasted = useRef<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const { state, upload, restart, reset } = useUpload()
  const callId = state.phase === 'processing' ? state.callId : null
  const live = useCallStatus(callId ? [callId] : [], () => router.refresh())
  const liveCall = callId ? live[callId] : undefined
  const rawStatus = liveCall?.status ?? (callId ? 'transcribing' : null)
  const status = retrying && rawStatus === 'failed' ? 'transcribing' : rawStatus
  if (retrying && rawStatus !== 'failed') setRetrying(false) // poll moved past 'failed'
  const uploading = state.phase === 'uploading'

  const close = () => {
    if (uploading) return
    if (state.phase !== 'processing' || status === 'done') reset()
    setRetrying(false)
    setRetryError(null)
    onClose()
    if (params.get('upload') === '1') {
      const next = new URLSearchParams(params.toString())
      next.delete('upload')
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }
  }
  const onEscape = useEffectEvent(close)

  // A retry masks the stale 'failed' status; stop masking after 15s so a repeat failure shows.
  useEffect(() => {
    if (!retrying) return
    const t = setTimeout(() => setRetrying(false), 15_000)
    return () => clearTimeout(t)
  }, [retrying])

  useEffect(() => {
    if (status === 'done' && callId && toasted.current !== callId) {
      toasted.current = callId
      toast.success('Call analysed')
    }
  }, [status, callId])

  // Focus management, scroll lock, Escape and Tab trap while open.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onEscape()
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) return
      const first = items[0], last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      opener?.focus?.()
    }
  }, [open])

  async function retry() {
    if (!callId) return
    setRetrying(true)
    setRetryError(null)
    try {
      await restart(callId)
    } catch (e) {
      setRetrying(false)
      setRetryError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  function another() {
    setRetryError(null)
    reset()
  }

  if (!open) return null
  const failedMessage = retryError ?? liveCall?.error ?? 'Processing failed.'

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => !uploading && close()}>
      <aside ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="upload-title" onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full flex-col overflow-y-auto bg-surface p-6 shadow-xl md:max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="upload-title" className="text-lg font-semibold">Upload a call</h2>
          <button ref={closeRef} type="button" aria-label="Close" onClick={close} aria-disabled={uploading || undefined} title={uploading ? 'Uploading…' : undefined}
            className={cn(uploading && 'cursor-not-allowed opacity-50', 'flex size-11 cursor-pointer items-center justify-center rounded-xl transition-colors duration-200 hover:bg-surface-2')}>
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {state.phase === 'idle' || state.phase === 'error' ? (
          <>
            <Dropzone onFile={upload} />
            {state.phase === 'error' && <p role="alert" className="mt-3 text-sm text-bad">{state.message}</p>}
          </>
        ) : (
          <div className="flex flex-col gap-6">
            <p className="truncate text-sm text-ink-2">{state.name}</p>
            <div aria-live="polite"><ProcessingSteps status={status} uploading={uploading} /></div>
            {status === 'failed' && <p role="alert" className="text-sm text-bad">{failedMessage}</p>}
            {retryError && status !== 'failed' && <p role="alert" className="text-sm text-bad">{retryError}</p>}
            {status === 'done' && callId && (
              <div className="flex flex-wrap gap-2">
                <Link href={`/calls/${callId}`} onClick={close} className={buttonClasses('primary')}>Open call</Link>
                <Button variant="secondary" onClick={another}>Upload another</Button>
              </div>
            )}
            {status === 'failed' && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={retry} loading={retrying} loadingLabel="Retrying…">Retry</Button>
                <Button variant="secondary" onClick={another}>Upload another</Button>
              </div>
            )}
          </div>
        )}
        <p className="mt-auto pt-6 text-xs text-ink-3">Recordings are stored privately and only signed-in staff can play them.</p>
      </aside>
    </div>
  )
}
