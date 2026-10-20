import { loadCallDetail } from '@/lib/data/callDetail'
import { CallDetailView } from '@/components/views/CallDetailView'

type Props = { params: Promise<{ id: string }> }

export default async function CallDetailPage({ params }: Props) {
  const { id } = await params
  const call = await loadCallDetail(id)
  return <CallDetailView call={call} />
}
