import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, PlusCircle, PackageOpen } from 'lucide-react'
import { useBookings } from '@/hooks/useBookings'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { RouteCell } from '@/components/booking/RouteCell'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatWeight } from '@/lib/format'
import { cn } from '@/lib/utils'
import { BOOKING_STATUSES, SHIPMENT_TYPE_LABELS, type BookingStatus } from '@/lib/types'

const PAGE_SIZE = 20

const TABS: { value: BookingStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  ...BOOKING_STATUSES.map((s) => ({
    value: s,
    label: s.charAt(0) + s.slice(1).toLowerCase(),
  })),
]

export default function BookingsListPage() {
  const [params, setParams] = useSearchParams()
  const statusParam = params.get('status') as BookingStatus | null
  const status = statusParam && BOOKING_STATUSES.includes(statusParam) ? statusParam : undefined
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)

  const { data, isLoading, isError } = useBookings({ page, limit: PAGE_SIZE, status })
  const items = data?.items ?? []
  const pagination = data?.pagination

  const setTab = (value: BookingStatus | 'ALL') => {
    const next = new URLSearchParams(params)
    if (value === 'ALL') next.delete('status')
    else next.set('status', value)
    next.delete('page')
    setParams(next)
  }

  const goToPage = (p: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(p))
    setParams(next)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Manage and track all your shipments."
        actions={
          <Button asChild>
            <Link to="/dashboard/bookings/new">
              <PlusCircle className="size-4" />
              New booking
            </Link>
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div className="inline-flex flex-wrap gap-1 rounded-[10px] border border-border bg-card p-1">
        {TABS.map((tab) => {
          const active = (tab.value === 'ALL' && !status) || tab.value === status
          return (
            <button
              key={tab.value}
              onClick={() => setTab(tab.value)}
              className={cn(
                'rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors duration-150',
                active
                  ? 'bg-[#eff6ff] text-[#21649c]'
                  : 'text-muted-foreground hover:bg-[#f8fafc] hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Booking</TableHead>
              <TableHead className="hidden md:table-cell">Route</TableHead>
              <TableHead className="hidden lg:table-cell">Type</TableHead>
              <TableHead className="text-right">Boxes</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Chargeable</TableHead>
              <TableHead className="hidden xl:table-cell">Created</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-destructive">
                  Couldn&apos;t load bookings. Please try again.
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={PackageOpen}
                    title={status ? `No ${status.toLowerCase()} bookings` : 'No bookings yet'}
                    description="Create your first shipment to start tracking your deliveries."
                    action={
                      <Button asChild>
                        <Link to="/dashboard/bookings/new">New booking</Link>
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((b) => (
                <TableRow key={b.id} className="cursor-pointer">
                  <TableCell>
                    <Link to={`/dashboard/bookings/${b.id}`} className="font-medium hover:underline">
                      {b.bookingNumber}
                    </Link>
                    <div className="text-xs text-muted-foreground md:hidden">
                      {b.shipper?.city ?? '—'} → {b.consignee?.city ?? '—'}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <RouteCell shipper={b.shipper} consignee={b.consignee} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {SHIPMENT_TYPE_LABELS[b.shipmentType]}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{b.summary.boxCount}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {formatWeight(b.summary.totalChargeableWeight)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                    {formatDate(b.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                <ChevronLeft className="size-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
