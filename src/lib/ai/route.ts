export type ProviderName = 'anthropic' | 'groq'

/** Calls up to 9 minutes fit comfortably in Groq's free per-minute token allowance. */
export const DEFAULT_GROQ_MAX_SEC = 540

/** Reads LLM_PROVIDER, GROQ_API_KEY, ANTHROPIC_API_KEY, LLM_AUTO_GROQ_MAX_SEC. */
type RouteEnv = Record<string, string | undefined>

/**
 * anthropic | groq → always that provider.
 * auto → short calls on Groq (free), long calls on Claude; falls back to whichever key exists.
 */
export function chooseProvider(env: RouteEnv, durationSec: number | null): ProviderName {
  const mode = env.LLM_PROVIDER || 'anthropic'
  if (mode === 'anthropic' || mode === 'groq') return mode
  if (mode !== 'auto') throw new Error(`Unknown LLM_PROVIDER: ${mode}`)

  const hasGroq = Boolean(env.GROQ_API_KEY)
  const hasClaude = Boolean(env.ANTHROPIC_API_KEY)
  if (!hasGroq && !hasClaude) throw new Error('LLM_PROVIDER=auto needs GROQ_API_KEY and/or ANTHROPIC_API_KEY')
  if (!hasClaude) return 'groq'
  if (!hasGroq) return 'anthropic'

  const configured = Number(env.LLM_AUTO_GROQ_MAX_SEC)
  const maxSec = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_GROQ_MAX_SEC
  return durationSec != null && durationSec <= maxSec ? 'groq' : 'anthropic'
}
