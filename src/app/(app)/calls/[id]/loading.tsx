import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-2 h-11 w-24" />
      <Skeleton className="mb-4 h-56 w-full md:h-36" />
      <Skeleton className="mb-4 h-16 w-full" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Skeleton className="h-[60vh] w-full" />
        <div className="flex flex-col gap-4"><Skeleton className="h-48" /><Skeleton className="h-64" /><Skeleton className="h-72" /></div>
      </div>
    </div>
  )
}
