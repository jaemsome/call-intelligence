import { cn } from '@/lib/utils'

export function Card({ className, children, accent = false }: { className?: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <section className={cn('rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-6', accent && 'border-l-4 border-l-accent', className)}>
      {children}
    </section>
  )
}

export function CardTitle({ children, action, hint }: { children: React.ReactNode; action?: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold md:text-lg">{children}</h2>
        {hint && <p className="mt-0.5 text-sm text-ink-3">{hint}</p>}
      </div>
      {action}
    </div>
  )
}
