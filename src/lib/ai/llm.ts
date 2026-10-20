import type { ZodType } from 'zod'
import { anthropicProvider } from './providers/anthropic'
import { groqProvider } from './providers/groq'
import { chooseProvider } from './route'

export type GenerateArgs<T> = { system: string; prompt: string; schema: ZodType<T>; schemaName: string; maxTokens?: number }

export interface LlmProvider {
  name: string
  model: string
  generate<T>(args: GenerateArgs<T>): Promise<T>
}

export class LlmError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message)
    this.name = 'LlmError'
  }
}

/** LLM_PROVIDER = anthropic (default) | groq | auto (route by call length — see ./route). */
export function getLlm(opts: { durationSec?: number | null } = {}): LlmProvider {
  const provider = chooseProvider(process.env, opts.durationSec ?? null)
  return provider === 'groq' ? groqProvider() : anthropicProvider()
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Validated JSON from the active model; up to 3 attempts, feeding validation errors back. */
export async function generateObject<T>(args: GenerateArgs<T>, llm: LlmProvider = getLlm(), backoffMs = 1500): Promise<{ data: T; provider: string; model: string }> {
  let lastError: unknown
  let prompt = args.prompt
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const data = await llm.generate({ ...args, prompt })
      return { data, provider: llm.name, model: llm.model }
    } catch (e) {
      lastError = e
      if (e instanceof LlmError && !e.retryable) break
      const reason = e instanceof Error ? e.message : String(e)
      prompt = `${args.prompt}\n\nYour previous answer failed: ${reason.slice(0, 400)}. Return JSON that matches the schema exactly.`
      if (backoffMs && attempt < 2) await sleep(backoffMs * 2 ** attempt)
    }
  }
  throw lastError
}
