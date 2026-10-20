import { describe, expect, it } from 'vitest'
import { groqErrorInfo } from './groqError'

describe('groqErrorInfo', () => {
  it('retries 429 and 5xx', () => {
    expect(groqErrorInfo(429, null).retryable).toBe(true)
    expect(groqErrorInfo(503, {}).retryable).toBe(true)
  })
  it('retries json_validate_failed without leaking body text', () => {
    const body = { error: { code: 'json_validate_failed', message: 'secret transcript text', failed_generation: 'caller said...' } }
    const info = groqErrorInfo(400, body)
    expect(info.retryable).toBe(true)
    expect(info.message).toContain('json_validate_failed')
    expect(info.message).not.toContain('failed_generation')
    expect(info.message).not.toContain('secret')
    expect(info.message).not.toContain('caller')
  })
  it('does not retry other 4xx and uses only code/type/status', () => {
    const a = groqErrorInfo(401, { error: { type: 'invalid_request_error', message: 'bad key sk-123' } })
    expect(a).toEqual({ message: 'Groq error 401 (invalid_request_error).', retryable: false })
    expect(groqErrorInfo(400, 'plain text failed_generation').message).toBe('Groq error 400.')
  })
  it('ignores unsafe code strings', () => {
    expect(groqErrorInfo(400, { error: { code: 'has spaces and text' } }).message).toBe('Groq error 400.')
  })
})
