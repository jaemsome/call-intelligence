'use client'

import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Brand, NavList } from './Sidebar'
import { LogoutButton } from './LogoutButton'

const FOCUSABLE = 'a[href], button:not([disabled])'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const openBtn = useRef<HTMLButtonElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const trigger = openBtn.current
    closeBtn.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return setOpen(false)
      if (e.key !== 'Tab' || !dialog.current) return
      const items = dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    const mq = window.matchMedia('(min-width: 1024px)')
    const onMq = (e: MediaQueryListEvent) => e.matches && setOpen(false)
    mq.addEventListener('change', onMq)
    return () => {
      window.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onMq)
      document.body.style.overflow = prevOverflow
      trigger?.focus()
    }
  }, [open])

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-2 backdrop-blur lg:hidden">
        <Brand />
        <button ref={openBtn} type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="flex size-11 cursor-pointer items-center justify-center rounded-xl hover:bg-surface-2">
          <Menu className="size-5" aria-hidden />
        </button>
      </div>
      {open && (
        <div ref={dialog} role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col bg-surface px-4 py-3 lg:hidden">
          <div className="mb-6 flex items-center justify-between">
            <Brand />
            <button ref={closeBtn} type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="flex size-11 cursor-pointer items-center justify-center rounded-xl hover:bg-surface-2">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <NavList onNavigate={() => setOpen(false)} />
          <div className="mt-auto"><LogoutButton /></div>
        </div>
      )}
    </>
  )
}
