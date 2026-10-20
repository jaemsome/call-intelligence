import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { generateObject, getLlm, LlmError, type LlmProvider } from './llm'

const schema = z.object({ ok: z.boolean() })
const args = { system: 's', prompt: 'p', schema, schemaName: 't' }

function fake(responses: Array<() => unknown>): LlmProvider & { prompts: string[] } {
  const prompts: string[] = []
  return {
    name: 'fake', model: 'fake-1', prompts,
    async generate(a) {
      prompts.push(a.prompt)
      const next = responses.shift()
      if (!next) throw new Error('no more responses')
      return next() as never
    },
  }
}

describe('generateObject', () => {
  it('returns data with provenance', async () => {
    const p = fake([() => ({ ok: true })])
    await expect(generateObject(args, p, 0)).resolves.toEqual({ data: { ok: true }, provider: 'fake', model: 'fake-1' })
  })
  it('retries retryable errors and feeds the error back into the prompt', async () => {
    const p = fake([() => { throw new LlmError('Response did not match the schema', true) }, () => ({ ok: true })])
    const res = await generateObject(args, p, 0)
    expect(res.data).toEqual({ ok: true })
    expect(p.prompts[1]).toContain('Response did not match the schema')
  })
  it('stops immediately on non-retryable errors', async () => {
    const p = fake([() => { throw new LlmError('Model declined', false) }, () => ({ ok: true })])
    await expect(generateObject(args, p, 0)).rejects.toThrow('Model declined')
    expect(p.prompts).toHaveLength(1)
  })
  it('gives up after 3 attempts', async () => {
    const boom = () => { throw new LlmError('busy', true) }
    const p = fake([boom, boom, boom, () => ({ ok: true })])
    await expect(generateObject(args, p, 0)).rejects.toThrow('busy')
    expect(p.prompts).toHaveLength(3)
  })
})

describe('getLlm', () => {
  it('throws on an unknown LLM_PROVIDER', () => {
    const prev = process.env.LLM_PROVIDER
    process.env.LLM_PROVIDER = 'openai'
    try {
      expect(() => getLlm()).toThrow('Unknown LLM_PROVIDER: openai')
    } finally {
      if (prev === undefined) delete process.env.LLM_PROVIDER
      else process.env.LLM_PROVIDER = prev
    }
  })
})
