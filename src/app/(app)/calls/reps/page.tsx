import { loadRepsOverview } from '@/lib/data/reps'
import { RepsView } from '@/components/views/RepsView'

export default async function RepsPage() {
  return <RepsView reps={await loadRepsOverview()} />
}
