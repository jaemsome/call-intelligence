import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export type Limiter = { limit: (key: string) => Promise<{ success: boolean }> }

const memory = new Map<string, { count: number; reset: number }>()

// Per-instance fallback for local dev when Upstash is not configured.
function memoryLimiter(prefix: string, max: number, windowMs: number): Limiter {
  return {
    async limit(key) {
      const id = `${prefix}:${key}`
      const now = Date.now()
      const entry = memory.get(id)
      if (!entry || entry.reset < now) {
        memory.set(id, { count: 1, reset: now + windowMs })
        return { success: true }
      }
      entry.count += 1
      return { success: entry.count <= max }
    },
  }
}

function make(prefix: string, max: number, seconds: number): Limiter {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(max, `${seconds} s`), prefix })
  }
  return memoryLimiter(prefix, max, seconds * 1000)
}

let login: Limiter | undefined
let api: Limiter | undefined
let processing: Limiter | undefined
let upload: Limiter | undefined
let deletes: Limiter | undefined
let status: Limiter | undefined

/** Max new call uploads per minute per IP — each one spends transcription and AI credit. */
export const UPLOADS_PER_MINUTE = 2

/** Auth routes: 5 attempts per minute per IP. */
export const getLoginLimiter = () => (login ??= make('rl:login', 5, 60))
/** General authenticated API routes: 120 per minute per IP (status polling included). */
export const getApiLimiter = () => (api ??= make('rl:api', 120, 60))
/** Pipeline starts: 20 per minute per IP (each one spends AI credit). */
export const getProcessLimiter = () => (processing ??= make('rl:process', 20, 60))
/** Upload URL creation: UPLOADS_PER_MINUTE per minute per IP. */
export const getUploadLimiter = () => (upload ??= make('rl:upload', UPLOADS_PER_MINUTE, 60))
/** Deletes: 15 per minute per IP (also used to clean up failed uploads). */
export const getDeleteLimiter = () => (deletes ??= make('rl:delete', 15, 60))
/** Status polling: 240 per minute per IP. */
export const getStatusLimiter = () => (status ??= make('rl:status', 240, 60))
