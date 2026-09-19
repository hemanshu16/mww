import { useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Stepper } from '@/components/booking/Stepper'
import { Step1Shipment } from '@/components/booking/Step1Shipment'
import { Step2Parties, type PartiesIntent } from '@/components/booking/Step2Parties'
import { Step3Review } from '@/components/booking/Step3Review'
import { Card, CardContent } from '@/components/ui/card'
import { useCourierProviders } from '@/hooks/useCourierProviders'
import {
  useBooking,
  useCreateBooking,
  useSubmitBooking,
  useUpdateBooking,
  useUpsertParties,
} from '@/hooks/useBookings'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import {
  bookingToStep1,
  bookingToStep2,
  emptyStep1,
  emptyStep2,
  step1ToCreateInput,
  step1ToUpdateInput,
  step2ToPartiesInput,
} from '@/lib/bookingMapping'
import type { Step1FormValues, Step2FormValues } from '@/lib/bookingSchemas'

export default function BookingWizardPage() {
  const { id } = useParams<{ id: string }>()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const providersQuery = useCourierProviders()
  const providers = providersQuery.data ?? []

  const bookingQuery = useBooking(id)
  const booking = bookingQuery.data

  const createMut = useCreateBooking()
  const updateMut = useUpdateBooking(id ?? '')
  const partiesMut = useUpsertParties(id ?? '')
  const submitMut = useSubmitBooking(id ?? '')

  const requestedStep = Number(params.get('step')) || (id ? 2 : 1)
  const step = id ? Math.min(3, Math.max(1, requestedStep)) : 1

  const goStep = (n: number) => {
    const next = new URLSearchParams(params)
    next.set('step', String(n))
    setParams(next)
  }

  // A non-draft booking can't be edited — send the user to the detail view.
  const redirectedRef = useRef(false)
  useEffect(() => {
    if (booking && booking.status !== 'DRAFT' && !redirectedRef.current) {
      redirectedRef.current = true
      toast.info('This booking can no longer be edited.')
      navigate(`/dashboard/bookings/${booking.id}`, { replace: true })
    }
  }, [booking, navigate])

  const handleConflict = (error: unknown): boolean => {
    if (error instanceof ApiRequestError && error.status === 409) {
      toast.error('This booking can no longer be edited.')
      if (id) {
        bookingQuery.refetch()
        navigate(`/dashboard/bookings/${id}`, { replace: true })
      }
      return true
    }
    return false
  }

  // --- Step 1 ---------------------------------------------------------------
  const onStep1 = async (values: Step1FormValues) => {
    try {
      if (!id) {
        const created = await createMut.mutateAsync(step1ToCreateInput(values))
        toast.success('Draft created.')
        navigate(`/dashboard/bookings/${created.id}/edit?step=2`)
      } else {
        await updateMut.mutateAsync(step1ToUpdateInput(values))
        toast.success('Shipment updated.')
        goStep(2)
      }
    } catch (error) {
      if (handleConflict(error)) return
      toast.error(getApiErrorMessage(error, 'Could not save shipment.'))
    }
  }

  // --- Step 2 ---------------------------------------------------------------
  const onStep2 = async (values: Step2FormValues, intent: PartiesIntent) => {
    if (!id) return
    try {
      await partiesMut.mutateAsync(step2ToPartiesInput(values))
      toast.success('Sender & receiver saved.')
      if (intent === 'later') navigate(`/dashboard/bookings/${id}`)
      else goStep(3)
    } catch (error) {
      if (handleConflict(error)) return
      toast.error(getApiErrorMessage(error, 'Could not save parties.'))
    }
  }

  // --- Step 3 ---------------------------------------------------------------
  const onSubmitBooking = async () => {
    if (!id) return
    try {
      await submitMut.mutateAsync()
      toast.success('Booking submitted!')
      navigate(`/dashboard/bookings/${id}`)
    } catch (error) {
      if (handleConflict(error)) return
      if (error instanceof ApiRequestError && error.status === 400) {
        toast.error(error.message)
        goStep(2)
        return
      }
      toast.error(getApiErrorMessage(error, 'Could not submit booking.'))
    }
  }

  const loadingBooking = !!id && bookingQuery.isLoading
  const title = id ? 'Edit booking' : 'New booking'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl tracking-tight">{title}</h1>
        {booking && (
          <p className="mt-1 text-sm text-muted-foreground">{booking.bookingNumber}</p>
        )}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <Stepper current={step} maxReachable={id ? 3 : 1} onStepClick={id ? goStep : undefined} />
        </CardContent>
      </Card>

      {loadingBooking ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : id && bookingQuery.isError ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-destructive">
            Couldn&apos;t load this booking.
          </CardContent>
        </Card>
      ) : step === 1 ? (
        <Step1Shipment
          defaultValues={booking ? bookingToStep1(booking) : emptyStep1()}
          providers={providers}
          providersLoading={providersQuery.isLoading}
          submitting={createMut.isPending || updateMut.isPending}
          submitLabel={id ? 'Save & continue' : 'Continue'}
          onSubmit={onStep1}
        />
      ) : !booking ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : step === 2 ? (
        <Step2Parties
          defaultValues={booking ? bookingToStep2(booking) : emptyStep2()}
          submitting={partiesMut.isPending}
          onSubmit={onStep2}
          onBack={() => goStep(1)}
        />
      ) : (
        <Step3Review
          booking={booking}
          submitting={submitMut.isPending}
          onSubmit={onSubmitBooking}
          onBack={() => goStep(2)}
        />
      )}
    </div>
  )
}
