'use client'

import { useEffect, useRef } from 'react'
import { Button } from './Button'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ open, title, description, confirmLabel, busy = false, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onClick={() => !busy && onCancel()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc" onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-2xl bg-surface p-6 shadow-xl md:max-w-md md:rounded-2xl">
        <h2 id="confirm-title" className="text-lg font-semibold">{title}</h2>
        <p id="confirm-desc" className="mt-2 text-sm text-ink-2">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={busy} loadingLabel="Deleting…">{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
