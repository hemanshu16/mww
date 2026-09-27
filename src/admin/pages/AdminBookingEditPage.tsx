import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import {
  isStaleBookingError,
  useAdminBooking,
  useLookupCountries,
  useLookupProviders,
  useUpdateAdminBooking,
  useUpdateAdminBookingParties,
} from '@/admin/hooks'
import { Step1Shipment, type ProviderOption } from '@/components/booking/Step1Shipment'
import { Step2Parties } from '@/components/booking/Step2Parties'
import { StatusBadge } from '@/components/StatusBadge'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  bookingToStep1,
  bookingToStep2,
  step1ToUpdateInput,
  step2ToPartiesInput,
} from '@/lib/bookingMapping'
import type { Step1FormValues, Step2FormValues } from '@/lib/bookingSchemas'
import { formatINR } from '@/lib/format'
import type { BookingItem, UpdateBookingInput } from '@/lib/types'
import { cn } from '@/lib/utils'
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

const SECTIONS = [
  { step: 1, label: 'Shipment & packages' },
  { step: 2, label: 'Parties & items' },
] as const

export default function AdminBookingEditPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const step = params.get('step') === '2' ? 2 : 1

  const { data: booking, isLoading, isError, refetch } = useAdminBooking(id)
  const providersQuery = useLookupProviders()
  const countriesQuery = useLookupCountries()
  const update = useUpdateAdminBooking(id)
  const parties = useUpdateAdminBookingParties(id)
  const [pendingPrice, setPendingPrice] = useState<UpdateBookingInput | null>(null)

  // Active couriers, plus the booking's current one even if it's since been deactivated.
  const providers = useMemo<ProviderOption[]>(() => {
    const list = providersQuery.data ?? []
    return list
      .filter((p) => p.status === 'ACTIVE' || p.id === booking?.courierProviderId)
      .map((p) => ({
        id: p.id,
        name: p.status === 'ACTIVE' ? p.name : `${p.name} (inactive)`,
        logoUrl: null,
      }))
  }, [providersQuery.data, booking?.courierProviderId])

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }
  if (isError || !booking) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-destructive">
          Couldn&apos;t load this booking.
        </CardContent>
      </Card>
    )
  }
  // Cancelled bookings are read-only.
  if (booking.status === 'CANCELLED') return <Navigate to={`/admin/bookings/${id}`} replace />

  const detailHref = `/admin/bookings/${id}`
  const currentPrice = booking.price ?? booking.totalPrice ?? null
  const destinationCode = booking.consigneeCountryCode ?? booking.consignee?.country ?? ''
  const destinationLabel =
    countriesQuery.data?.find((c) => c.alpha2 === destinationCode)?.name ?? (destinationCode || '—')

  const handleError = (error: unknown, fallback: string) => {
    if (isStaleBookingError(error)) {
      toast.error('This booking was changed by someone else.', {
        description: 'The latest version has been loaded. Review it and save again.',
      })
      void refetch()
      return
    }
    toast.error(getApiErrorMessage(error, fallback))
  }

  const saveShipment = async (input: UpdateBookingInput) => {
    try {
      await update.mutateAsync({ ...input, expectedUpdatedAt: booking.updatedAt })
      const repriced =
        booking.status === 'BOOKED' && input.price != null && input.price !== currentPrice
      toast.success(repriced ? 'Booking updated and wallet re-charged.' : 'Booking updated.')
      navigate(detailHref)
    } catch (error) {
      handleError(error, 'Could not save the booking.')
    } finally {
      setPendingPrice(null)
    }
  }

  const onStep1 = (values: Step1FormValues, items?: BookingItem[]) => {
    const input = step1ToUpdateInput(values, items)
    // A price change on a booked booking moves money: confirm first.
    if (booking.status === 'BOOKED' && input.price != null && input.price !== currentPrice) {
      setPendingPrice(input)
      return
    }
    void saveShipment(input)
  }

  const onStep2 = async (values: Step2FormValues) => {
    try {
      await parties.mutateAsync({
        ...step2ToPartiesInput(values),
        expectedUpdatedAt: booking.updatedAt,
      })
      toast.success('Parties and items updated.')
      navigate(detailHref)
    } catch (error) {
      handleError(error, 'Could not save parties.')
    }
  }

  // Remount the forms whenever the server copy changes (e.g. after a stale reload).
  const formKey = `${booking.id}-${booking.updatedAt}`

  return (
    <div className="space-y-6">
      <Link
        to={detailHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {booking.bookingNumber}
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-bold leading-[34px] tracking-[-0.02em] text-foreground">
            Edit {booking.bookingNumber}
          </h1>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {booking.customer.name} · {booking.customer.companyName}
          {booking.status === 'BOOKED' &&
            ' · Changing the price refunds the old amount and charges the new one.'}
        </p>
      </div>

      <div
        className="inline-flex gap-1 rounded-[10px] border border-border bg-card p-1"
        role="tablist"
        aria-label="Edit section"
      >
        {SECTIONS.map((s) => (
          <button
            key={s.step}
            role="tab"
            aria-selected={step === s.step}
            onClick={() => setParams(s.step === 1 ? {} : { step: '2' })}
            className={cn(
              'rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors duration-150',
              step === s.step
                ? 'bg-[#eff6ff] text-[#21649c]'
                : 'text-muted-foreground hover:bg-[#f8fafc] hover:text-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {step === 1 ? (
        <Step1Shipment
          key={formKey}
          defaultValues={bookingToStep1(booking)}
          providers={providers}
          providersLoading={providersQuery.isLoading}
          submitting={update.isPending}
          submitLabel="Save changes"
          onSubmit={onStep1}
          items={booking.items}
          lockDestination
          destinationLabel={destinationLabel}
          pricing="manual"
          secondaryAction={
            <Button asChild variant="ghost" className="w-full">
              <Link to={detailHref}>Cancel</Link>
            </Button>
          }
        />
      ) : (
        <Step2Parties
          key={formKey}
          defaultValues={bookingToStep2(booking)}
          packages={booking.packages}
          submitting={parties.isPending}
          onSubmit={onStep2}
          onBack={() => navigate(detailHref)}
          kycReadOnly
          layout="edit"
        />
      )}

      <Dialog open={!!pendingPrice} onOpenChange={(o) => !o && setPendingPrice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change the price?</DialogTitle>
            <DialogDescription>
              The customer&apos;s wallet will be refunded {formatINR(booking.netCharged)} and
              charged {formatINR(pendingPrice?.price ?? 0)}. The customer&apos;s credit limit
              doesn&apos;t apply. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Go back</Button>
            </DialogClose>
            <Button
              loading={update.isPending}
              onClick={() => pendingPrice && void saveShipment(pendingPrice)}
            >
              Change price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
