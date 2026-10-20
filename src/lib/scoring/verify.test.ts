import { describe, expect, it } from 'vitest'
import { verifyQuote } from './verify'

const segs = [
  { idx: 0, text: 'Thank you for calling Summit Pest, this is Michelle.' },
  { idx: 1, text: 'Hi, I have ants all over my kitchen.' },
  { idx: 2, text: "Oh no, I'm so sorry to hear about the ants in your kitchen! I can definitely take care of this for you." },
  { idx: 3, text: 'When did you first start seeing them?' },
]

describe('verifyQuote', () => {
  it('verifies an exact quote on the cited line', () => {
    expect(verifyQuote('I can definitely take care of this for you.', 2, segs)).toEqual({ verified: true, lineIdx: 2 })
  })
  it('ignores case and punctuation differences', () => {
    expect(verifyQuote('i can definitely take care of this for you', 2, segs)).toEqual({ verified: true, lineIdx: 2 })
  })
  it('corrects an off-by-one line number', () => {
    expect(verifyQuote('When did you first start seeing them?', 2, segs)).toEqual({ verified: true, lineIdx: 3 })
  })
  it('finds the quote anywhere when the line is wrong or missing', () => {
    expect(verifyQuote('this is Michelle', null, segs)).toEqual({ verified: true, lineIdx: 0 })
  })
  it('tolerates a small wording slip (>= 85% of words present)', () => {
    expect(verifyQuote("I'm so sorry to hear about the ants in the kitchen", 2, segs).verified).toBe(true)
  })
  it('rejects a fabricated quote', () => {
    expect(verifyQuote('We also have an amazing referral program.', 2, segs)).toEqual({ verified: false, lineIdx: 2 })
  })
  it('rejects empty quotes', () => {
    expect(verifyQuote(null, 1, segs).verified).toBe(false)
    expect(verifyQuote('   ', 1, segs).verified).toBe(false)
  })
  it('does not match inside longer words', () => {
    expect(verifyQuote('ok', 5, [{ idx: 5, text: 'Let me book that for you' }]).verified).toBe(false)
    expect(verifyQuote('you', 3, [{ idx: 3, text: 'they are young' }]).verified).toBe(false)
  })
  it('does not search globally for quotes under 3 words', () => {
    const far = [{ idx: 0, text: 'Hello there.' }, { idx: 1, text: 'a' }, { idx: 2, text: 'b' }, { idx: 3, text: 'c' }, { idx: 4, text: 'Thank you so much.' }]
    expect(verifyQuote('thank you', 0, far).verified).toBe(false)
    expect(verifyQuote('thank you', 3, far)).toEqual({ verified: true, lineIdx: 4 })
  })
  it('ignores stopwords when measuring coverage', () => {
    const lines = [{ idx: 0, text: 'i can help you with that one later definitely not' }]
    expect(verifyQuote('i can definitely help you with that', 0, lines).verified).toBe(true)
    expect(verifyQuote('you can do that for me', 0, [{ idx: 0, text: 'you can see that for me' }]).verified).toBe(false)
  })
  it('requires an exact match when a quote has under 2 content words', () => {
    expect(verifyQuote('i did that for you', 0, [{ idx: 0, text: 'you did see that for me i' }]).verified).toBe(false)
  })
})
