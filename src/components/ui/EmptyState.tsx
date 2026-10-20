import type { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-line bg-surface px-6 py-12 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent"><Icon className="size-6" aria-hidden /></span>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-ink-2">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
