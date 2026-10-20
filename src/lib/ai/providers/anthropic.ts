import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { requireEnv } from '@/lib/env'
import { LlmError, type LlmProvider } from '../llm'

const RETRYABLE_STATUS = new Set([408, 409])

function toLlmError(e: unknown): LlmError {
  if (e instanceof LlmError) return e
  if (e instanceof Anthropic.RateLimitError || e instanceof Anthropic.InternalServerError || e instanceof Anthropic.APIConnectionError) {
    return new LlmError(e.message, true)
  }
  if (e instanceof Anthropic.APIError) return new LlmError(e.message, RETRYABLE_STATUS.has(e.status ?? 0))
  return new LlmError(e instanceof Error ? e.message : String(e), true)
}

export function anthropicProvider(): LlmProvider {
  // Retries are handled by generateObject, so the SDK itself does not retry.
  const client = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY'), maxRetries: 0, timeout: 90_000 })
  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5'
  return {
    name: 'anthropic',
    model,
    async generate({ system, prompt, schema, maxTokens = 16000 }) {
      try {
        const res = await client.messages.create({
          model,
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: prompt }],
          output_config: { format: zodOutputFormat(schema), effort: 'medium' },
        })
        if (res.stop_reason === 'refusal') throw new LlmError('The model declined to analyse this call.', false)
        if (res.stop_reason === 'max_tokens') throw new LlmError('The model response was cut off.', true)
        const block = res.content.find((b) => b.type === 'text')
        let json: unknown
        try {
          json = JSON.parse(block && block.type === 'text' ? block.text : '')
        } catch {
          throw new LlmError('Response was not valid JSON.', true)
        }
        const parsed = schema.safeParse(json)
        if (!parsed.success) {
          throw new LlmError(`Response did not match the schema: ${z.prettifyError(parsed.error).slice(0, 400)}`, true)
        }
        return parsed.data
      } catch (e) {
        throw toLlmError(e)
      }
    },
  }
}
