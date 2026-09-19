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
import type { Booking, CreateBookingInput, PartiesInput, UpdateBookingInput } from '@/lib/types'

export function useBookings(params: ListBookingsParams) {
  return useQuery({
    queryKey: queryKeys.bookings(params),
    queryFn: () => listBookings(params),
    placeholderData: (prev) => prev,
  })
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.booking(id ?? ''),
    queryFn: () => getBooking(id as string),
    enabled: !!id,
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
  return useMutation({
    mutationFn: () => submitBooking(id),
    onSuccess: write,
  })
}

export function useCancelBooking(id: string) {
  const write = useBookingCacheWriter()
  return useMutation({
    mutationFn: () => cancelBooking(id),
    onSuccess: write,
  })
}
