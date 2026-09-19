import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BookingStatus } from '@/lib/types'

const MAP: Record<
  BookingStatus,
  { label: string; variant: 'draft' | 'booked' | 'cancelled'; dot: string }
> = {
  DRAFT: { label: 'Draft', variant: 'draft', dot: 'bg-[#64748b]' },
  BOOKED: { label: 'Booked', variant: 'booked', dot: 'bg-[#2563eb]' },
  CANCELLED: { label: 'Cancelled', variant: 'cancelled', dot: 'bg-[#dc2626]' },
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, variant, dot } = MAP[status]
  return (
    <Badge variant={variant}>
      <span className={cn('size-1.5 rounded-full', dot)} aria-hidden />
      {label}
    </Badge>
  )
}
