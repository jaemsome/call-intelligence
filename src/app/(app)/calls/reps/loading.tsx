import { PageSkeletonHeader, Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <PageSkeletonHeader />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
    </div>
  )
}
