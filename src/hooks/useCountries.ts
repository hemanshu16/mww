import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCountry,
  deleteCountry,
  listBookableCountries,
  listCountries,
  updateCountry,
} from '@/lib/api/countries'
import { queryKeys } from '@/lib/queryKeys'
import type { Country, CountryInput, CountryList } from '@/lib/types'

/**
 * The API caps `limit` at 300 so every country fits in one call. We load the
 * whole set once and filter/sort/paginate client-side, which keeps search
 * instant and lets the coverage summary count every region.
 */
export function useCountries() {
  return useQuery({
    queryKey: queryKeys.countries,
    queryFn: () => listCountries({ limit: 300, sortOrder: 'asc' }),
    select: (data) => data.items,
  })
}

/** Countries customers can ship to (booking wizard). */
export function useBookableCountries(enabled = true) {
  return useQuery({
    enabled,
    queryKey: queryKeys.bookableCountries,
    queryFn: listBookableCountries,
    select: (data) => data.items,
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CountryInput) => createCountry(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.countries }),
  })
}

export function useUpdateCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CountryInput> }) =>
      updateCountry(id, input),
    // Optimistic so the visibility switch flips instantly.
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: queryKeys.countries })
      const previous = qc.getQueryData<CountryList>(queryKeys.countries)
      if (previous) {
        qc.setQueryData<CountryList>(queryKeys.countries, {
          ...previous,
          items: previous.items.map((c) => (c.id === id ? ({ ...c, ...input } as Country) : c)),
        })
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.countries, ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.countries }),
  })
}

export function useDeleteCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCountry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.countries }),
  })
}
