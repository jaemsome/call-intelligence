import { PageSkeletonHeader, Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <PageSkeletonHeader />
      <div className="mb-3 flex gap-2 overflow-hidden">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-11 w-24 shrink-0 rounded-full" />)}</div>
      <div className="mb-4 flex flex-col gap-2 md:flex-row">
        <Skeleton className="h-11 w-full md:w-72" />
        <Skeleton className="h-11 w-full md:w-32" />
        <Skeleton className="h-11 w-full md:w-32" />
      </div>
      <div className="flex flex-col gap-2 md:hidden">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
      <div className="hidden md:block">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  )
}
