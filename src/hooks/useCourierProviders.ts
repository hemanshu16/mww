import { useQuery } from '@tanstack/react-query'
import { listCourierProviders } from '@/lib/api/couriers'
import { queryKeys } from '@/lib/queryKeys'

export function useCourierProviders() {
  return useQuery({
    queryKey: queryKeys.courierProviders,
    queryFn: listCourierProviders,
    staleTime: 5 * 60 * 1000,
  })
}
