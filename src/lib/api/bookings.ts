import { apiClient } from '@/lib/api/client'
import type {
  Booking,
  BookingList,
  BookingStatus,
  CreateBookingInput,
  PartiesInput,
  UpdateBookingInput,
} from '@/lib/types'

export interface ListBookingsParams {
  page?: number
  limit?: number
  status?: BookingStatus
}

export function listBookings(params: ListBookingsParams = {}) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.status) qs.set('status', params.status)
  const query = qs.toString()
  return apiClient.get<BookingList>(`/bookings${query ? `?${query}` : ''}`)
}

export function getBooking(id: string) {
  return apiClient.get<Booking>(`/bookings/${id}`)
}

export function createBooking(input: CreateBookingInput) {
  return apiClient.post<Booking>('/bookings', input)
}

export function updateBooking(id: string, input: UpdateBookingInput) {
  return apiClient.patch<Booking>(`/bookings/${id}`, input)
}

export function upsertParties(id: string, input: PartiesInput) {
  return apiClient.put<Booking>(`/bookings/${id}/parties`, input)
}

export function submitBooking(id: string) {
  return apiClient.post<Booking>(`/bookings/${id}/submit`)
}

export function cancelBooking(id: string) {
  return apiClient.post<Booking>(`/bookings/${id}/cancel`)
}
