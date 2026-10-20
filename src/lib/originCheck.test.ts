import { describe, expect, it } from 'vitest'
import { isAllowedOrigin } from './originCheck'

const req = (headers: Record<string, string>) =>
  new Request('https://app.test/api/x', { method: 'POST', headers })

describe('isAllowedOrigin', () => {
  it('allows same-origin requests', () => {
    expect(isAllowedOrigin(req({ origin: 'https://app.test', host: 'app.test' }))).toBe(true)
  })
  it('allows server-to-server requests with no Origin header', () => {
    expect(isAllowedOrigin(req({ host: 'app.test' }))).toBe(true)
  })
  it('rejects a different origin', () => {
    expect(isAllowedOrigin(req({ origin: 'https://evil.test', host: 'app.test' }))).toBe(false)
  })
  it('prefers x-forwarded-host behind a proxy', () => {
    expect(isAllowedOrigin(req({ origin: 'https://app.test', host: 'internal', 'x-forwarded-host': 'app.test' }))).toBe(true)
  })
  it('rejects a malformed origin', () => {
    expect(isAllowedOrigin(req({ origin: 'not a url', host: 'app.test' }))).toBe(false)
  })
})
