export type RepRecord = { id: string; name: string; aliases: string[] }

export function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Exact name/alias match first, then a unique first-name match. Never guesses between two people. */
export function matchRep(spoken: string, reps: RepRecord[]): RepRecord | null {
  const target = normalizeName(spoken)
  if (!target) return null
  const exact = reps.filter((r) => [r.name, ...r.aliases].some((n) => normalizeName(n) === target))
  if (exact.length) return exact.length === 1 ? exact[0] : null
  if (target.includes(' ')) return null
  const byFirst = reps.filter((r) => normalizeName(r.name).split(' ')[0] === target)
  return byFirst.length === 1 ? byFirst[0] : null
}
