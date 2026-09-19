import { Badge } from '@/components/ui/badge'
import type { BookingStatus } from '@/lib/types'

const MAP: Record<BookingStatus, { label: string; variant: 'neutral' | 'success' | 'destructive' }> = {
  DRAFT: { label: 'Draft', variant: 'neutral' },
  BOOKED: { label: 'Booked', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, variant } = MAP[status]
  return <Badge variant={variant}>{label}</Badge>
}
