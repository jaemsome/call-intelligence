'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/Spinner'

export function LogoutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function logout() {
    setBusy(true)
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (!res.ok) throw new Error('logout failed')
      router.replace('/login')
      router.refresh()
    } catch {
      setBusy(false)
      toast.error('Could not log out — please try again')
    }
  }
  return (
    <button type="button" onClick={logout} disabled={busy}
      className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm text-ink-2 transition-colors hover:bg-surface-2 disabled:opacity-60">
      {busy ? <Spinner /> : <LogOut className="size-4" aria-hidden />}{busy ? 'Logging out…' : 'Log out'}
    </button>
  )
}
