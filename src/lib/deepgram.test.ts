import { describe, expect, it } from 'vitest'
import { redactSecrets } from './deepgram'

const url = 'https://x.supabase.co/storage/v1/object/sign/recordings/c1/a.mp3?token=abc.def'

describe('redactSecrets', () => {
  it('redacts the full audio URL', () => expect(redactSecrets(`bad ${url} here`, url)).toBe('bad [url] here'))
  it('redacts other URLs', () => expect(redactSecrets('see https://a.b/c?d=1 now', url)).toBe('see [url] now'))
  it('redacts scheme-less token query strings', () => {
    expect(redactSecrets('fetch failed: /sign/a.mp3?token=SECRET123', url)).toBe('fetch failed: /sign/a.mp3?token=[redacted]')
  })
  it('redacts bare JWTs', () => {
    expect(redactSecrets('jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig_-x done', url)).toBe('jwt [jwt] done')
  })
})
