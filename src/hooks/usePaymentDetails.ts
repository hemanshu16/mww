import { useQuery } from '@tanstack/react-query'
import { getPaymentDetails } from '@/lib/api/company'
import { queryKeys } from '@/lib/queryKeys'

/** Loaded when the panel opens; rarely changes, so reuse it for 10 minutes. */
export function usePaymentDetails(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.paymentDetails,
    queryFn: getPaymentDetails,
    enabled,
    staleTime: 10 * 60 * 1000,
  })
}
