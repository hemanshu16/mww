import { apiClient } from '@/lib/api/client'
import type { CourierProvider } from '@/lib/types'

export function listCourierProviders() {
  return apiClient.get<CourierProvider[]>('/courier-providers')
}
