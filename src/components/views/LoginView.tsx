'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Rocket } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function LoginView() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'redirecting'>('idle')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setError(null)
    let res: Response
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      setError('Network error — please try again.')
      setState('idle')
      return
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Sign in failed')
      setState('idle')
      return
    }
    setState('redirecting')
    router.replace('/calls')
    router.refresh()
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      {state === 'redirecting' && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/90 text-sm text-ink-2">Opening Call Intelligence…</div>
      )}
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-white"><Rocket className="size-5" aria-hidden /></span>
          <div>
            <p className="font-semibold">PestLaunch</p>
            <p className="text-sm text-ink-3">Call Intelligence</p>
          </div>
        </div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)}
          className="mb-4 h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-base outline-none focus:ring-2 focus:ring-accent" />
        <label className="mb-1 block text-sm font-medium" htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" required maxLength={200} value={password} onChange={(e) => setPassword(e.target.value)}
          className="mb-4 h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-base outline-none focus:ring-2 focus:ring-accent" />
        {error && <p role="alert" className="mb-4 text-sm text-bad">{error}</p>}
        <Button type="submit" className="w-full" loading={state !== 'idle'} loadingLabel="Signing in…">Sign in</Button>
      </form>
    </main>
  )
}
