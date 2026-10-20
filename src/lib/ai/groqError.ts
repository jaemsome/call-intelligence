export type GroqErrorInfo = { message: string; retryable: boolean }

/** Maps a failed Groq response to a safe message. Never includes the response body text. */
export function groqErrorInfo(status: number, body: unknown): GroqErrorInfo {
  const err = (body as { error?: { code?: unknown; type?: unknown } } | null)?.error
  const code = typeof err?.code === 'string' ? err.code : typeof err?.type === 'string' ? err.type : null
  const safe = code && /^[\w.-]{1,60}$/.test(code) ? code : null
  if (status === 429 || status >= 500) return { message: `Groq is busy (${status}).`, retryable: true }
  if (safe === 'json_validate_failed') return { message: 'Groq returned invalid JSON (json_validate_failed).', retryable: true }
  return { message: safe ? `Groq error ${status} (${safe}).` : `Groq error ${status}.`, retryable: false }
}
