import type { ListBookingsParams } from '@/lib/api/bookings'
import type { ListWalletTxnParams } from '@/lib/api/wallet'

export const queryKeys = {
  me: ['me'] as const,
  courierProviders: ['courier-providers'] as const,
  bookings: (params: ListBookingsParams) => ['bookings', params] as const,
  bookingsRoot: ['bookings'] as const,
  booking: (id: string) => ['booking', id] as const,
  bookingCounts: ['booking-counts'] as const,
  countries: ['admin-countries'] as const,
  bookableCountries: ['bookable-countries'] as const,
  postalSearch: (country: string, q: string) => ['postal-search', country, q] as const,
  wallet: ['wallet'] as const,
  paymentDetails: ['payment-details'] as const,
  walletTransactions: (params: ListWalletTxnParams) => ['wallet-transactions', params] as const,
  walletTransactionsRoot: ['wallet-transactions'] as const,
  kycDownload: (path: string) => ['kyc-download', path] as const,
}
