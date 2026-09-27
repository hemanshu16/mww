import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { BookingRecap } from '@/components/booking/BookingRecap'
import { WalletFundsCheck } from '@/components/booking/WalletFundsCheck'
import { bookingPrice, isShortOfFunds } from '@/hooks/useBookings'
import { useWallet } from '@/hooks/useWallet'
import type { Booking } from '@/lib/types'

export function Step3Review({
  booking,
  submitting,
  onSubmit,
  onBack,
}: {
  booking: Booking
  submitting: boolean
  onSubmit: () => void
  onBack: () => void
}) {
  const ready = !!booking.shipper && !!booking.consignee
  const wallet = useWallet()
  const price = bookingPrice(booking)
  const shortOfFunds = isShortOfFunds(price, wallet.data)

  return (
    <div className="space-y-6">
      {ready ? (
        <Alert variant="info">
          <CheckCircle2 />
          <AlertTitle>Ready to submit</AlertTitle>
          <AlertDescription>
            Review the details below. Once submitted, the booking is confirmed and can no longer be
            edited.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertTitle>Sender and receiver required</AlertTitle>
          <AlertDescription>
            Add both sender and receiver details before submitting this booking.
          </AlertDescription>
        </Alert>
      )}

      <BookingRecap booking={booking} />

      <WalletFundsCheck price={price} wallet={wallet.data} loading={wallet.isLoading} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
          Back to edit
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          loading={submitting}
          disabled={!ready || shortOfFunds}
        >
          Submit booking
        </Button>
      </div>
    </div>
  )
}
