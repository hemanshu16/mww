import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelBooking,
  createBooking,
  getBooking,
  listBookings,
  submitBooking,
  updateBooking,
  upsertParties,
  type ListBookingsParams,
} from '@/lib/api/bookings'
import { queryKeys } from '@/lib/queryKeys'
import type {
  Booking,
  CreateBookingInput,
  PartiesInput,
  UpdateBookingInput,
  WalletSummary,
} from '@/lib/types'

/** True when the wallet is known to be unable to cover `price`. */
export function isShortOfFunds(price: number | null, wallet: WalletSummary | undefined): boolean {
  return price != null && !!wallet && price > wallet.availableBalance
}

export function useBookings(params: ListBookingsParams) {
  return useQuery({
    queryKey: queryKeys.bookings(params),
    queryFn: () => listBookings(params),
    placeholderData: (prev) => prev,
    // Staff can change price and status after submit; always show the latest.
    staleTime: 0,
  })
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.booking(id ?? ''),
    queryFn: () => getBooking(id as string),
    enabled: !!id,
    staleTime: 0,
  })
}

function useBookingCacheWriter() {
  const qc = useQueryClient()
  return (booking: Booking) => {
    qc.setQueryData(queryKeys.booking(booking.id), booking)
    qc.invalidateQueries({ queryKey: queryKeys.bookingsRoot })
    qc.invalidateQueries({ queryKey: queryKeys.bookingCounts })
  }
}

export function useCreateBooking() {
  const write = useBookingCacheWriter()
  return useMutation({
    mutationFn: (input: CreateBookingInput) => createBooking(input),
    onSuccess: write,
  })
}

export function useUpdateBooking(id: string) {
  const write = useBookingCacheWriter()
  return useMutation({
    mutationFn: (input: UpdateBookingInput) => updateBooking(id, input),
    onSuccess: write,
  })
}

export function useUpsertParties(id: string) {
  const write = useBookingCacheWriter()
  return useMutation({
    mutationFn: (input: PartiesInput) => upsertParties(id, input),
    onSuccess: write,
  })
}

export function useSubmitBooking(id: string) {
  const write = useBookingCacheWriter()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => submitBooking(id),
    onSuccess: (booking) => {
      write(booking)
      // Submitting debits the wallet.
      qc.invalidateQueries({ queryKey: queryKeys.wallet })
      qc.invalidateQueries({ queryKey: queryKeys.walletTransactionsRoot })
    },
    // Our cached balance was stale; refresh it so the shortfall warning shows.
    onError: (error) => {
      if (isInsufficientBalanceError(error)) qc.invalidateQueries({ queryKey: queryKeys.wallet })
    },
  })
}

/** Server message when the wallet can't cover the booking price. */
export function isInsufficientBalanceError(error: unknown): boolean {
  return error instanceof Error && /insufficient wallet balance/i.test(error.message)
}

/** Price debited on submit; older responses only carry `totalPrice`. */
export function bookingPrice(booking: Booking): number | null {
  return booking.price ?? booking.totalPrice ?? null
}

export function useCancelBooking(id: string) {
  const write = useBookingCacheWriter()
  return useMutation({
    mutationFn: () => cancelBooking(id),
    onSuccess: write,
  })
}
