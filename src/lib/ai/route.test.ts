import { describe, expect, it } from 'vitest'
import { chooseProvider, DEFAULT_GROQ_MAX_SEC } from './route'

const both = { LLM_PROVIDER: 'auto', GROQ_API_KEY: 'g', ANTHROPIC_API_KEY: 'a' }

describe('chooseProvider', () => {
  it('defaults to anthropic when LLM_PROVIDER is unset', () => {
    expect(chooseProvider({}, 100)).toBe('anthropic')
  })
  it('honours a fixed provider regardless of call length', () => {
    expect(chooseProvider({ LLM_PROVIDER: 'groq' }, 1200)).toBe('groq')
    expect(chooseProvider({ LLM_PROVIDER: 'anthropic' }, 30)).toBe('anthropic')
  })
  it('rejects unknown providers', () => {
    expect(() => chooseProvider({ LLM_PROVIDER: 'openai' }, 30)).toThrow('Unknown LLM_PROVIDER: openai')
  })
  it('auto: short calls go to Groq, long calls to Claude (default 9 minutes, inclusive)', () => {
    expect(DEFAULT_GROQ_MAX_SEC).toBe(540)
    expect(chooseProvider(both, 300)).toBe('groq')
    expect(chooseProvider(both, 540)).toBe('groq')
    expect(chooseProvider(both, 541)).toBe('anthropic')
  })
  it('auto: unknown length goes to Claude (safer for large inputs)', () => {
    expect(chooseProvider(both, null)).toBe('anthropic')
  })
  it('auto: falls back to whichever key exists', () => {
    expect(chooseProvider({ LLM_PROVIDER: 'auto', GROQ_API_KEY: 'g' }, 1200)).toBe('groq')
    expect(chooseProvider({ LLM_PROVIDER: 'auto', ANTHROPIC_API_KEY: 'a' }, 60)).toBe('anthropic')
  })
  it('auto: needs at least one key', () => {
    expect(() => chooseProvider({ LLM_PROVIDER: 'auto' }, 60)).toThrow('GROQ_API_KEY')
  })
  it('auto: the cut-off is configurable', () => {
    expect(chooseProvider({ ...both, LLM_AUTO_GROQ_MAX_SEC: '120' }, 200)).toBe('anthropic')
    expect(chooseProvider({ ...both, LLM_AUTO_GROQ_MAX_SEC: 'junk' }, 200)).toBe('groq')
  })
})
