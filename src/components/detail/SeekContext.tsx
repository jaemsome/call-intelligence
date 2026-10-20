'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type SeekActions = {
  focusedLine: number | null
  setCurrentMs: (ms: number) => void
  register: (el: HTMLAudioElement | null) => void
  seek: (ms: number, play?: boolean) => void
  focusLine: (idx: number | null, ms?: number) => void
}
type Seek = SeekActions & { currentMs: number }

// Split so components that only trigger seeks don't re-render on every timeupdate (~4Hz).
const ActionsCtx = createContext<SeekActions | null>(null)
const TimeCtx = createContext<number>(0)

export function SeekProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [currentMs, setCurrentMs] = useState(0)
  const [focusedLine, setFocusedLine] = useState<number | null>(null)

  const register = useCallback((el: HTMLAudioElement | null) => { audio.current = el }, [])
  const seek = useCallback((ms: number, play = true) => {
    const el = audio.current
    if (!el) return
    const max = Number.isFinite(el.duration) ? el.duration * 1000 : Infinity
    const clamped = Math.min(Math.max(ms, 0), max)
    el.currentTime = clamped / 1000
    setCurrentMs(clamped)
    if (play) void el.play().catch(() => undefined)
  }, [])
  const focusLine = useCallback((idx: number | null, ms?: number) => {
    setFocusedLine(idx)
    if (idx != null) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      document.getElementById(`line-${idx}`)?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
    }
    if (ms != null) seek(ms)
  }, [seek])

  const actions = useMemo<SeekActions>(
    () => ({ focusedLine, setCurrentMs, register, seek, focusLine }),
    [focusedLine, register, seek, focusLine],
  )
  return (
    <ActionsCtx value={actions}>
      <TimeCtx value={currentMs}>{children}</TimeCtx>
    </ActionsCtx>
  )
}

/** Actions + focusedLine only; does not re-render on playback time updates. */
export function useSeekActions(): SeekActions {
  const ctx = useContext(ActionsCtx)
  if (!ctx) throw new Error('useSeekActions must be used inside <SeekProvider>')
  return ctx
}

export function useSeekTime(): number {
  return useContext(TimeCtx)
}

/** Everything, including currentMs (re-renders ~4Hz while playing). */
export function useSeek(): Seek {
  const actions = useSeekActions()
  const currentMs = useSeekTime()
  return useMemo(() => ({ ...actions, currentMs }), [actions, currentMs])
}
