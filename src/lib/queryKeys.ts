import type { ListBookingsParams } from '@/lib/api/bookings'

export const queryKeys = {
  me: ['me'] as const,
  courierProviders: ['courier-providers'] as const,
  bookings: (params: ListBookingsParams) => ['bookings', params] as const,
  bookingsRoot: ['bookings'] as const,
  booking: (id: string) => ['booking', id] as const,
  bookingCounts: ['booking-counts'] as const,
  kycDownload: (path: string) => ['kyc-download', path] as const,
}
