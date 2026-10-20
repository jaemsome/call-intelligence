import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-4 h-11 w-28" />
      <Skeleton className="mb-4 h-9 w-48" />
      <Skeleton className="mb-4 h-28" />
      <Skeleton className="mb-4 h-64" />
      <Skeleton className="h-72" />
    </div>
  )
}
