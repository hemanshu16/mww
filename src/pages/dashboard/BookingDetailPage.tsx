import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Ban, Loader2, Pencil, Send } from 'lucide-react'
import { useBooking, useCancelBooking, useSubmitBooking } from '@/hooks/useBookings'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/StatusBadge'
import { BookingRecap } from '@/components/booking/BookingRecap'
import { formatDateTime } from '@/lib/format'

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: booking, isLoading, isError, error } = useBooking(id)
  const submitMut = useSubmitBooking(id ?? '')
  const cancelMut = useCancelBooking(id ?? '')
  const [cancelOpen, setCancelOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !booking) {
    const notFound = error instanceof ApiRequestError && error.status === 404
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="font-medium">{notFound ? 'Booking not found' : 'Something went wrong'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {notFound ? 'This booking may have been removed or never existed.' : 'Please try again.'}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/dashboard/bookings">Back to bookings</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isDraft = booking.status === 'DRAFT'
  const canCancel = booking.status === 'DRAFT' || booking.status === 'BOOKED'

  const handleSubmit = async () => {
    try {
      await submitMut.mutateAsync()
      toast.success('Booking submitted!')
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 400) {
        toast.error(err.message)
        navigate(`/dashboard/bookings/${booking.id}/edit?step=2`)
        return
      }
      toast.error(getApiErrorMessage(err, 'Could not submit booking.'))
    }
  }

  const handleCancel = async () => {
    try {
      await cancelMut.mutateAsync()
      toast.success('Booking cancelled.')
      setCancelOpen(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not cancel booking.'))
      setCancelOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to bookings
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] font-bold leading-[34px] tracking-[-0.02em] text-foreground">
              {booking.bookingNumber}
            </h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {formatDateTime(booking.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <>
              <Button asChild variant="outline">
                <Link to={`/dashboard/bookings/${booking.id}/edit?step=1`}>
                  <Pencil className="size-4" /> Edit
                </Link>
              </Button>
              <Button onClick={handleSubmit} loading={submitMut.isPending}>
                <Send className="size-4" /> Submit
              </Button>
            </>
          )}
          {canCancel && (
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setCancelOpen(true)}
            >
              <Ban className="size-4" /> Cancel
            </Button>
          )}
        </div>
      </div>

      <BookingRecap booking={booking} />

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              {booking.bookingNumber} will be marked as cancelled. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={cancelMut.isPending}>
                Keep booking
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleCancel} loading={cancelMut.isPending}>
              Cancel booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
