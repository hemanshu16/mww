import { apiClient } from '@/lib/api/client'

export interface PostalPlace {
  countryCode: string
  postalCode: string
  placeName: string
  admin1: string | null
}

/** Most suggestions the dropdown shows (the API caps `limit` at 100). */
export const POSTAL_RESULT_LIMIT = 50

/** Postal codes in a country matching a place name or partial code. */
export function searchPostalCodes(country: string, q: string, signal?: AbortSignal) {
  const qs = new URLSearchParams({
    country: country.toUpperCase(),
    q,
    limit: String(POSTAL_RESULT_LIMIT),
  })
  return apiClient.get<PostalPlace[]>(`/postal-codes/search?${qs}`, { signal })
}

/** "Sanala, Gujarat" */
export function placeLabel(p: Pick<PostalPlace, 'placeName' | 'admin1'>) {
  return [p.placeName, p.admin1].filter(Boolean).join(', ')
}
