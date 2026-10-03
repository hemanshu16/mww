import { useNavigate } from 'react-router-dom'
import { PackageOpen } from 'lucide-react'
import { Pager } from '@/admin/components/ListControls'
import { getAdminBookingDocument } from '@/admin/api'
import { BookingDocumentsPopover } from '@/components/booking/BookingDocumentsCard'
import type { AdminBookingRow } from '@/admin/types'
import { formatDate, formatINR, formatWeight } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Pagination } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function AdminBookingsTable({
  items,
  pagination,
  page,
  onPage,
  isLoading,
  isError,
  filtered,
  showCustomer = true,
  toolbar,
}: {
  items: AdminBookingRow[]
  pagination?: Pagination
  page: number
  onPage: (page: number) => void
  isLoading: boolean
  isError: boolean
  filtered: boolean
  /** Off on a customer's own Bookings tab. */
  showCustomer?: boolean
  toolbar?: React.ReactNode
}) {
  const navigate = useNavigate()
  const columns = showCustomer ? 9 : 8

  return (
    <Card className="overflow-hidden">
      {toolbar}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Booking</TableHead>
            {showCustomer && <TableHead className="hidden md:table-cell">Customer</TableHead>}
            <TableHead className="hidden lg:table-cell">Courier</TableHead>
            <TableHead className="hidden sm:table-cell">Destination</TableHead>
            <TableHead className="hidden xl:table-cell">Ship date</TableHead>
            <TableHead className="hidden text-right lg:table-cell">Boxes / weight</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Documents</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: columns }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-full max-w-[120px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={columns} className="py-12 text-center text-sm text-destructive">
                Couldn&apos;t load bookings. Please try again.
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns} className="p-0">
                <EmptyState
                  icon={PackageOpen}
                  title={filtered ? 'No bookings match these filters' : 'No bookings yet'}
                  description={filtered ? 'Try other words or remove a filter.' : undefined}
                />
              </TableCell>
            </TableRow>
          ) : (
            items.map((b) => (
              <TableRow
                key={b.id}
                className={cn('cursor-pointer', b.status === 'CANCELLED' && 'bg-[#fbfcfe]')}
                onClick={() => navigate(`/admin/bookings/${b.id}`)}
              >
                <TableCell>
                  <p className="font-medium text-foreground">{b.bookingNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.consigneeName ? `To ${b.consigneeName}` : 'Parties not added'}
                    <span className="xl:hidden"> · {formatDate(b.createdAt)}</span>
                  </p>
                </TableCell>
                {showCustomer && (
                  <TableCell className="hidden md:table-cell">
                    <p className="max-w-[200px] truncate text-sm">{b.customer.name}</p>
                    <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {b.customer.companyName}
                    </p>
                  </TableCell>
                )}
                <TableCell className="hidden text-sm lg:table-cell">
                  {b.courierProvider.name}
                </TableCell>
                <TableCell className="hidden text-sm sm:table-cell">
                  {b.destination?.name ?? '—'}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                  {formatDate(b.shipmentDate)}
                </TableCell>
                <TableCell className="hidden text-right text-sm tabular-nums lg:table-cell">
                  {b.boxCount} · {formatWeight(b.totalChargeableWeight)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {b.price != null ? formatINR(b.price) : '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={b.status} />
                </TableCell>
                <TableCell className="text-right">
                  {b.status === 'BOOKED' ? (
                    <BookingDocumentsPopover
                      bookingNumber={b.bookingNumber}
                      fetchLink={(type, download) => getAdminBookingDocument(b.id, type, download)}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pager pagination={pagination} page={page} onPage={onPage} />
    </Card>
  )
}
