import { normalizeText } from '@/lib/utils'

type Line = { idx: number; text: string }
export type VerifyResult = { verified: boolean; lineIdx: number | null }

const MIN_COVERAGE = 0.85
const MIN_WORDS_FOR_FUZZY = 3
const STOPWORDS = new Set(['i', 'you', 'the', 'a', 'an', 'to', 'and', 'of', 'it', 'that', 'this', 'is', 'for', 'with', 'we', 'me', 'my', 'your', 'so', 'just'])

/** Whole-word containment: "ok" never matches "book". */
function boundaryIncludes(line: string, quote: string): boolean {
  return ` ${line} `.includes(` ${quote} `)
}

/** Share of the quote's content words (stopwords ignored) that appear in the line; null when too few content words. */
function coverage(quote: string, line: string): number | null {
  const content = quote.split(' ').filter((w) => !STOPWORDS.has(w))
  if (content.length < 2) return null
  const words = new Set(line.split(' '))
  return content.filter((w) => words.has(w)).length / content.length
}

function matches(quote: string, lineText: string, fuzzy: boolean): boolean {
  const line = normalizeText(lineText)
  if (boundaryIncludes(line, quote)) return true
  if (!fuzzy) return false
  const c = coverage(quote, line)
  return c != null && c >= MIN_COVERAGE
}

/** Confirms a model-cited quote really exists in the transcript; checks the cited line, ±2 neighbours, then (for 3+ word quotes) everywhere. */
export function verifyQuote(quote: string | null, lineIdx: number | null, lines: Line[]): VerifyResult {
  const q = normalizeText(quote ?? '')
  if (!q) return { verified: false, lineIdx }
  const fuzzy = q.split(' ').length >= MIN_WORDS_FOR_FUZZY
  const byIdx = new Map(lines.map((l) => [l.idx, l]))
  if (lineIdx != null) {
    for (const offset of [0, -1, 1, -2, 2]) {
      const line = byIdx.get(lineIdx + offset)
      if (line && matches(q, line.text, fuzzy)) return { verified: true, lineIdx: line.idx }
    }
  }
  if (fuzzy) {
    const anywhere = lines.find((l) => boundaryIncludes(normalizeText(l.text), q))
    if (anywhere) return { verified: true, lineIdx: anywhere.idx }
  }
  return { verified: false, lineIdx }
}
