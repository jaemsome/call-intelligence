export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

const pad = (n: number) => String(n).padStart(2, '0')

export function formatDuration(totalSec: number | null | undefined): string {
  if (totalSec == null || !Number.isFinite(totalSec) || totalSec < 0) return '—'
  const s = Math.round(totalSec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`
}

export function formatTimestamp(ms: number): string {
  return formatDuration(ms / 1000)
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’`]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function percent(part: number, whole: number): number | null {
  if (!whole) return null
  return Math.round((part / whole) * 100)
}

export function labelFromFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? ''
  const label = base.replace(/\.[a-z0-9]+$/i, '').replace(/\s+/g, ' ').trim().slice(0, 80)
  return label || 'Untitled call'
}

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatDateShort(iso: string | null | undefined): string {
  const d = toDate(iso)
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
}

export function formatDateFull(iso: string | null | undefined): string {
  const d = toDate(iso)
  return d
    ? d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
