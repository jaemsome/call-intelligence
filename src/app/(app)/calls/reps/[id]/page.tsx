import { loadRepDetail } from '@/lib/data/reps'
import { RepDetailView } from '@/components/views/RepDetailView'

type Props = { params: Promise<{ id: string }> }

export default async function RepDetailPage({ params }: Props) {
  const { id } = await params
  return <RepDetailView {...await loadRepDetail(id)} />
}
