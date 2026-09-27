import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchPostalCodes } from '@/lib/api/postal'
import { queryKeys } from '@/lib/queryKeys'

export const POSTAL_MIN_CHARS = 2

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/** Debounced postal-code suggestions for a place name or partial code. */
export function usePostalSearch(country: string, query: string, enabled = true) {
  const q = useDebounced(query.trim(), 250)
  const active = enabled && !!country && q.length >= POSTAL_MIN_CHARS
  const result = useQuery({
    queryKey: queryKeys.postalSearch(country, q.toLowerCase()),
    queryFn: ({ signal }) => searchPostalCodes(country, q, signal),
    enabled: active,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  })
  // True while the user is still typing ahead of the debounce.
  const pending = active ? result.isFetching || q !== query.trim() : false
  return { ...result, active, pending, debouncedQuery: q }
}
