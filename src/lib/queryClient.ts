import { QueryClient } from '@tanstack/react-query'
import { ApiRequestError } from '@/lib/api/client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: (failureCount, error) => {
        // Don't retry auth/permission/not-found errors — only transient ones.
        if (error instanceof ApiRequestError && [400, 401, 403, 404, 409].includes(error.status)) {
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
  },
})
