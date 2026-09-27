import { apiClient } from '@/lib/api/client'
import type { PaymentDetails } from '@/lib/types'

/** Where customers pay: legal name, GSTIN and the active bank accounts. */
export function getPaymentDetails() {
  return apiClient.get<PaymentDetails>('/company/payment-details')
}
