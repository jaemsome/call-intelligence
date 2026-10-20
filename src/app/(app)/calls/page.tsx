import { loadOverview } from '@/lib/data/overview'
import { OverviewView } from '@/components/views/OverviewView'

export default async function OverviewPage() {
  return <OverviewView {...await loadOverview()} />
}
