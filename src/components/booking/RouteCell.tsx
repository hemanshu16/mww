import { ArrowRight } from 'lucide-react'
import type { Consignee, Shipper } from '@/lib/types'

export function RouteCell({
  shipper,
  consignee,
}: {
  shipper: Shipper | null
  consignee: Consignee | null
}) {
  const from = shipper?.city
  const to = consignee ? [consignee.city, consignee.country].filter(Boolean).join(', ') : null

  if (!from && !to) {
    return <span className="text-sm text-muted-foreground">Parties pending</span>
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="font-medium">{from ?? '—'}</span>
      <ArrowRight className="size-3.5 text-muted-foreground" />
      <span className="font-medium">{to ?? '—'}</span>
    </span>
  )
}
