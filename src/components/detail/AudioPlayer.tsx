'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react'
import { formatTimestamp } from '@/lib/utils'
import { useSeek } from './SeekContext'

const RATES = [1, 1.25, 1.5, 2]
const iconBtn = 'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-50'

export function AudioPlayer({ callId, durationSec }: { callId: string; durationSec: number | null }) {
  const { register, setCurrentMs, currentMs, seek } = useSeek()
  const ref = useRef<HTMLAudioElement>(null)
  const retries = useRef(0)
  const loaded = useRef(false)
  const wasPlaying = useRef(false)
  const resume = useRef<{ ms: number; play: boolean } | null>(null)
  const restoring = useRef(false)
  const [src, setSrc] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [failed, setFailed] = useState(false)
  const [drag, setDrag] = useState<number | null>(null)
  const [realSec, setRealSec] = useState<number | null>(null)
  const totalMs = (realSec ?? durationSec ?? 0) * 1000

  const sign = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/calls/audio-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callId }) })
      return res.ok ? ((await res.json()).url as string) : null
    } catch {
      return null
    }
  }, [callId])
  const load = useCallback(() => {
    void sign().then((url) => (url ? setSrc(url) : setFailed(true)))
  }, [sign])

  useEffect(() => { load() }, [load])
  useEffect(() => { register(ref.current); return () => register(null) }, [register])
  useEffect(() => { if (ref.current) ref.current.playbackRate = rate }, [rate, src])

  const onError = () => {
    const el = ref.current
    const code = el?.error?.code
    // Only network (2) / src-not-supported (4) errors on a URL that already worked can mean expiry; never decode (3).
    if (el && loaded.current && retries.current < 1 && (code === 2 || code === 4)) {
      retries.current += 1
      loaded.current = false
      restoring.current = true
      resume.current = { ms: el.currentTime * 1000, play: wasPlaying.current }
      setPlaying(false)
      load()
    } else {
      restoring.current = false
      setFailed(true)
    }
  }
  const onLoadedMetadata = (el: HTMLAudioElement) => {
    if (Number.isFinite(el.duration) && el.duration > 0) setRealSec(el.duration)
    const r = resume.current
    if (!r) return
    resume.current = null
    el.currentTime = r.ms / 1000
    el.playbackRate = rate
    if (r.play) void el.play().catch(() => undefined)
  }

  const commitDrag = () => {
    if (drag == null) return
    seek(drag, playing)
    setDrag(null)
  }
  const retry = () => {
    retries.current = 0
    loaded.current = false
    restoring.current = false
    setPlaying(false)
    setFailed(false)
    load()
  }
  const toggle = () => {
    const el = ref.current
    if (!el) return
    if (el.paused) void el.play().catch(() => undefined)
    else el.pause()
  }
  const nudge = (deltaMs: number) => seek(Math.min(Math.max(currentMs + deltaMs, 0), totalMs), playing)
  const position = drag ?? Math.min(currentMs, totalMs)

  return (
    <div className="sticky top-16 z-20 mb-4 rounded-2xl border border-line bg-surface/95 px-3 py-2 shadow-sm backdrop-blur lg:top-4" role="group" aria-label="Call recording player">
      <audio ref={ref} src={src ?? undefined} preload="metadata"
        onTimeUpdate={(e) => { if (!restoring.current) setCurrentMs(e.currentTarget.currentTime * 1000) }}
        onSeeked={() => { if (restoring.current) { restoring.current = false; retries.current = 0 } }}
        onPlaying={() => { retries.current = 0 }}
        onLoadedMetadata={(e) => onLoadedMetadata(e.currentTarget)}
        onCanPlay={() => { loaded.current = true }}
        onPlay={() => { wasPlaying.current = true; setPlaying(true) }}
        onPause={() => { wasPlaying.current = false; setPlaying(false) }}
        onError={onError} />
      {failed ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
          <p className="text-sm text-bad">The recording could not be loaded.</p>
          <button type="button" onClick={retry} className="h-11 cursor-pointer rounded-xl px-3 text-sm font-semibold text-accent hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent">Try again</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1 md:flex-nowrap md:gap-2">
          <button type="button" className={iconBtn} onClick={() => nudge(-15000)} aria-label="Back 15 seconds" disabled={!src}><RotateCcw className="size-4" aria-hidden /></button>
          <button type="button" onClick={toggle} disabled={!src} aria-label={playing ? 'Pause' : 'Play'}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-white transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-50">
            {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5 translate-x-px" aria-hidden />}
          </button>
          <button type="button" className={iconBtn} onClick={() => nudge(15000)} aria-label="Forward 15 seconds" disabled={!src}><RotateCw className="size-4" aria-hidden /></button>
          <span className="w-12 shrink-0 text-right text-xs tabular-nums text-ink-3" aria-hidden>{formatTimestamp(position)}</span>
          <input type="range" min={0} max={Math.max(totalMs, 1)} step={250} value={position} disabled={!src}
            aria-label="Playback position" aria-valuetext={`${formatTimestamp(position)} of ${formatTimestamp(totalMs)}`}
            onChange={(e) => setDrag(Number(e.target.value))}
            onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)} onPointerUp={commitDrag} onPointerCancel={commitDrag} onKeyUp={commitDrag} onBlur={commitDrag}
            className="order-last h-11 min-w-0 basis-full md:order-none md:basis-auto md:flex-1 cursor-pointer accent-[var(--accent)] disabled:cursor-default disabled:opacity-50" />
          <span className="w-12 shrink-0 text-xs tabular-nums text-ink-3" aria-hidden>{formatTimestamp(totalMs)}</span>
          <button type="button" onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])} aria-label={`Playback speed ${rate}x`}
            className="h-11 min-w-11 shrink-0 cursor-pointer rounded-xl px-2 text-xs font-semibold tabular-nums text-ink-2 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent">{rate}×</button>
        </div>
      )}
    </div>
  )
}
