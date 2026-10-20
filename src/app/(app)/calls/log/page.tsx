import { loadCallsLog } from '@/lib/data/calls'
import { CallsLogView } from '@/components/views/CallsLogView'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function CallsLogPage({ searchParams }: Props) {
  const data = await loadCallsLog(await searchParams)
  return <CallsLogView {...data} />
}
