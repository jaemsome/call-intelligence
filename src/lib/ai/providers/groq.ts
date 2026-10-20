import { z } from 'zod'
import { requireEnv } from '@/lib/env'
import { groqErrorInfo } from '../groqError'
import { LlmError, type LlmProvider } from '../llm'

function parseJson(text: unknown): unknown {
  if (typeof text !== 'string') return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export function groqProvider(): LlmProvider {
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
  return {
    name: 'groq',
    model,
    async generate({ system, prompt, schema, schemaName, maxTokens = 8000 }) {
      const jsonSchema: Record<string, unknown> = { ...z.toJSONSchema(schema) }
      delete jsonSchema.$schema
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(90_000),
        headers: { Authorization: `Bearer ${requireEnv('GROQ_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_completion_tokens: maxTokens,
          messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
          response_format: { type: 'json_schema', json_schema: { name: schemaName, schema: jsonSchema, strict: false } },
        }),
      })
      if (!res.ok) {
        const info = groqErrorInfo(res.status, parseJson(await res.text().catch(() => null)))
        throw new LlmError(info.message, info.retryable)
      }
      const body = await res.json()
      const choice = body.choices?.[0]
      if (choice?.finish_reason === 'length') throw new LlmError('The model response was cut off.', true)
      const parsed = schema.safeParse(parseJson(choice?.message?.content))
      if (!parsed.success) throw new LlmError(`Response did not match the schema: ${z.prettifyError(parsed.error).slice(0, 400)}`, true)
      return parsed.data
    },
  }
}
