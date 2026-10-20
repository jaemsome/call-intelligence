import { PageSkeletonHeader, Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div role="status" aria-label="Loading overview">
      <PageSkeletonHeader />
      <div className="mb-4 rounded-2xl border border-line bg-surface p-4 md:p-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
      <Skeleton className="mb-4 h-56 w-full rounded-2xl" />
      <div className="mb-4 grid gap-4 lg:grid-cols-2"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
      <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
    </div>
  )
}
