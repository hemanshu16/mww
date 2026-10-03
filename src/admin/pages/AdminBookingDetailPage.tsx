import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Ban, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import {
  isStaleBookingError,
  useAdminBooking,
  useCancelAdminBooking,
  useDeleteAdminBooking,
} from '@/admin/hooks'
import { ActivityHistory } from '@/admin/components/activity/ActivityList'
import { AdminKycSection } from '@/admin/components/bookings/AdminKycSection'
import type { AdminBookingDetail } from '@/admin/types'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { formatDate, formatDateTime, formatINR } from '@/lib/format'
import { WALLET_CATEGORY_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { BookingRecap } from '@/components/booking/BookingRecap'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function PaymentsCard({ booking }: { booking: AdminBookingDetail }) {
  const price = booking.price ?? booking.totalPrice ?? null
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-baseline justify-between gap-2 space-y-0">
        <CardTitle>Payments</CardTitle>
        <div className="flex gap-6 text-sm">
          <span className="text-muted-foreground">
            Price{' '}
            <span className="font-semibold tabular-nums text-foreground">
              {price != null ? formatINR(price) : '—'}
            </span>
          </span>
          <span className="text-muted-foreground">
            Net charged{' '}
            <span className="font-semibold tabular-nums text-foreground">
              {formatINR(booking.netCharged)}
            </span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {booking.walletTransactions.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            Nothing charged yet. The wallet is debited when the booking is submitted.
          </p>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {booking.walletTransactions.map((t) => {
              const credit = t.type === 'CREDIT'
              return (
                <li key={t.id} className="flex items-start justify-between gap-4 px-6 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {WALLET_CATEGORY_LABELS[t.category] ?? t.category}
                    </p>
                    {t.note && <p className="truncate text-xs text-muted-foreground">{t.note}</p>}
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(t.createdAt)} · {t.createdBy?.name ?? 'System'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 font-medium tabular-nums',
                      credit ? 'text-[#047857]' : 'text-[#b91c1c]',
                    )}
                  >
                    {credit ? '+' : '−'}
                    {formatINR(t.amount)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminBookingDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { can } = useStaffAuth()
  const [params, setParams] = useSearchParams()
  const { data: booking, isLoading, isError, error, refetch } = useAdminBooking(id)
  const cancel = useCancelAdminBooking(id)
  const remove = useDeleteAdminBooking(id)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const back = (
    <Link
      to="/admin/bookings"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Bookings
    </Link>
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !booking) {
    const notFound = error instanceof ApiRequestError && [400, 404].includes(error.status)
    return (
      <div className="space-y-6">
        {back}
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-medium">{notFound ? 'Booking not found' : 'Something went wrong'}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {notFound ? 'It may have been deleted.' : 'Please try again.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cancelled = booking.status === 'CANCELLED'
  const booked = booking.status === 'BOOKED'
  const canEdit = can('booking.update') && !cancelled
  const canCancel = can('booking.cancel') && !cancelled
  // Only bookings that were never charged can be deleted.
  const canDelete = can('booking.delete') && booking.walletTransactions.length === 0
  const showHistory = can('audit_log.read')
  const tab = showHistory && params.get('tab') === 'history' ? 'history' : 'details'

  /** Someone else changed it: show them the latest version. */
  const onStale = () => {
    toast.error('This booking was changed by someone else.', {
      description: 'The latest version has been loaded. Check it and try again.',
    })
    void refetch()
  }

  const confirmCancel = async () => {
    try {
      await cancel.mutateAsync({
        reason: reason.trim() || undefined,
        expectedUpdatedAt: booking.updatedAt,
      })
      toast.success(
        booked
          ? `Booking cancelled. ${formatINR(booking.netCharged)} refunded to the customer's wallet.`
          : 'Booking cancelled.',
      )
      setCancelOpen(false)
      setReason('')
    } catch (err) {
      setCancelOpen(false)
      if (isStaleBookingError(err)) onStale()
      else toast.error(getApiErrorMessage(err, 'Could not cancel the booking.'))
    }
  }

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync()
      toast.success(`${booking.bookingNumber} deleted.`)
      navigate('/admin/bookings', { replace: true })
    } catch (err) {
      setDeleteOpen(false)
      toast.error(getApiErrorMessage(err, 'Could not delete the booking.'))
      void refetch()
    }
  }

  return (
    <div className="space-y-6">
      {back}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-bold leading-[34px] tracking-[-0.02em] text-foreground">
              {booking.bookingNumber}
            </h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {can('customer.read') ? (
              <Link
                to={`/admin/customers/${booking.customer.id}`}
                className="font-medium text-primary hover:underline"
              >
                {booking.customer.name}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{booking.customer.name}</span>
            )}{' '}
            · {booking.customer.companyName} · {booking.courierProvider.name} · Ships{' '}
            {formatDate(booking.shipmentDate)}
          </p>
          <p className="text-xs text-muted-foreground">
            Created {formatDateTime(booking.createdAt)} · Updated{' '}
            {formatDateTime(booking.updatedAt)}
          </p>
        </div>
        {(canEdit || canCancel || canDelete) && (
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button asChild>
                <Link to={`/admin/bookings/${booking.id}/edit`}>
                  <Pencil className="size-4" /> Edit
                </Link>
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setCancelOpen(true)}
              >
                <Ban className="size-4" /> Cancel booking
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {cancelled && (
        <p className="rounded-[10px] border border-border bg-[#f8fafc] px-4 py-3 text-sm text-muted-foreground">
          This booking is cancelled and can no longer be changed.
        </p>
      )}

      <Tabs value={tab} onValueChange={(v) => setParams(v === 'history' ? { tab: 'history' } : {})}>
        {showHistory && (
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="details" className={cn('space-y-6', showHistory && 'mt-6')}>
          <PaymentsCard booking={booking} />
          <BookingRecap
            booking={booking}
            showItems
            shipperKyc={<AdminKycSection booking={booking} onStale={onStale} />}
          />
        </TabsContent>
        {showHistory && (
          <TabsContent value="history" className="mt-6">
            <ActivityHistory entityType="BOOKING" entityId={booking.id} />
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel {booking.bookingNumber}?</DialogTitle>
            <DialogDescription>
              {booked
                ? `${formatINR(booking.netCharged)} will be refunded to the customer's wallet.`
                : 'This draft has not been charged, so nothing is refunded.'}{' '}
              A cancelled booking can&apos;t be changed again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Reason (optional)</Label>
            <Textarea
              id="cancel-reason"
              rows={2}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer request"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Keep booking</Button>
            </DialogClose>
            <Button variant="destructive" loading={cancel.isPending} onClick={confirmCancel}>
              {booked ? 'Cancel & refund' : 'Cancel booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {booking.bookingNumber}?</DialogTitle>
            <DialogDescription>
              This permanently deletes the booking. It can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Keep booking</Button>
            </DialogClose>
            <Button variant="destructive" loading={remove.isPending} onClick={confirmDelete}>
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
