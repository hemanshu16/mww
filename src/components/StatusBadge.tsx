import { Badge } from '@/components/ui/badge'
import type { BookingStatus } from '@/lib/types'

const MAP: Record<BookingStatus, { label: string; variant: 'draft' | 'booked' | 'cancelled' }> = {
  DRAFT: { label: 'Draft', variant: 'draft' },
  BOOKED: { label: 'Booked', variant: 'booked' },
  CANCELLED: { label: 'Cancelled', variant: 'cancelled' },
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, variant } = MAP[status]
  return (
    <Badge variant={variant}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </Badge>
  )
}
