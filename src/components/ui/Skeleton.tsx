import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-xl bg-line/70', className)} />
}

export function PageSkeletonHeader() {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-11 w-72" />
    </div>
  )
}
