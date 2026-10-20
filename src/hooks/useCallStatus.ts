'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { CallStatus } from '@/lib/types'
import { isAbandoned, isStuck } from '@/lib/pipeline/nextStep'

export type LiveStatus = { id: string; status: CallStatus; error: string | null; failed_step?: string | null; status_at?: string }
const NONE: Record<string, LiveStatus> = {}

const MAX_BACKOFF_MS = 20_000
const RESCUE_RETRY_MS = 60_000
const MAX_IDS = 50 // status API cap; processing calls beyond this wait for a later poll
// Statuses a run rests in when it paused at the Vercel time budget; a fresh
// 'start' call resumes from the last completed step.
const RESTING: CallStatus[] = ['transcribed', 'classified']

/** Polls while calls are processing, resumes paused runs, and calls onSettled when any newly finish. */
export function useCallStatus(ids: string[], onSettled: () => void, intervalMs = 2500) {
  const [live, setLive] = useState<Record<string, LiveStatus>>({})
  const settle = useEffectEvent(onSettled)
  const resumed = useRef(new Set<string>()) // `${id}:${status}` pairs already continued
  const rescued = useRef(new Map<string, number>()) // `${id}:${status_at}` -> last attempt time (Infinity = done)
  const settled = useRef(new Set<string>()) // ids already reported as done/failed
  const key = ids.slice(0, MAX_IDS).join(',')

  useEffect(() => {
    if (!key) return
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let delay = intervalMs
    let inFlight = false

    const rescue = (c: LiveStatus) => {
      const pair = `${c.id}:${c.status_at}`
      const last = rescued.current.get(pair)
      if (last !== undefined && Date.now() - last < RESCUE_RETRY_MS) return
      rescued.current.set(pair, Date.now())
      fetch('/api/calls/process', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callId: c.id, mode: 'start' }),
      })
        .then((res) => { if (res.ok || res.status < 429 || (res.status > 429 && res.status < 500)) rescued.current.set(pair, Infinity) })
        .catch(() => undefined) // keep the timestamp: retry after RESCUE_RETRY_MS
    }

    const resume = (c: LiveStatus) => {
      const pair = `${c.id}:${c.status}`
      if (resumed.current.has(pair)) return
      resumed.current.add(pair)
      fetch('/api/calls/process', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callId: c.id, mode: 'start' }),
      })
        .then((res) => { if (!res.ok && res.status !== 409) resumed.current.delete(pair) })
        .catch(() => resumed.current.delete(pair)) // retry on a later tick
    }

    const schedule = () => {
      if (!stopped && !document.hidden) timer = setTimeout(tick, delay)
    }

    const tick = async () => {
      if (inFlight) return
      inFlight = true
      timer = undefined
      let ok = false
      try {
        const res = await fetch('/api/calls/status', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: key.split(',') }),
        })
        if (stopped) return
        if (res.ok) {
          const { calls } = (await res.json()) as { calls: LiveStatus[] }
          if (stopped) return
          ok = true
          setLive(Object.fromEntries(calls.map((c) => [c.id, c])))
          // Reset bookkeeping so a retried/re-run call can settle and resume again.
          for (const c of calls) {
            if (c.status !== 'done' && c.status !== 'failed') settled.current.delete(c.id)
            if (!RESTING.includes(c.status)) RESTING.forEach((r) => resumed.current.delete(`${c.id}:${r}`))
          }
          calls.filter((c) => RESTING.includes(c.status)).forEach(resume)
          calls.filter((c) => isStuck(c.status, c.status_at, Date.now()) || isAbandoned(c.status, c.status_at, Date.now())).forEach(rescue)
          const fresh = calls.filter((c) => (c.status === 'done' || c.status === 'failed') && !settled.current.has(c.id))
          if (fresh.length) {
            fresh.forEach((c) => settled.current.add(c.id))
            settle()
          }
        }
      } catch {
        // network error: fall through to backoff
      }
      inFlight = false
      if (stopped) return
      delay = ok ? intervalMs : Math.min(delay * 2, MAX_BACKOFF_MS)
      schedule()
    }

    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(timer)
        timer = undefined
      } else if (!inFlight && timer === undefined) {
        delay = intervalMs
        tick()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    if (!document.hidden) tick()

    return () => {
      stopped = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [key, intervalMs])

  return key ? live : NONE // no ids: never expose stale live status
}
