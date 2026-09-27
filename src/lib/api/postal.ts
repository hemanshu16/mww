export interface PostalPlace {
  countryCode: string
  postalCode: string
  placeName: string
  admin1: string | null
}

const BASE_URL = import.meta.env.VITE_POSTAL_API_BASE_URL || '/postal-api'

/** Postal codes in a country matching a place name or partial code. */
export async function searchPostalCodes(
  country: string,
  q: string,
  signal?: AbortSignal,
): Promise<PostalPlace[]> {
  const qs = new URLSearchParams({ country, q })
  const res = await fetch(`${BASE_URL}/postal-search?${qs}`, {
    headers: { accept: 'application/json' },
    signal,
  })
  if (!res.ok) throw new Error(`Postal code lookup failed (${res.status})`)
  const data = (await res.json()) as unknown
  return Array.isArray(data) ? (data as PostalPlace[]) : []
}

/** "Sanala, Gujarat" */
export function placeLabel(p: Pick<PostalPlace, 'placeName' | 'admin1'>) {
  return [p.placeName, p.admin1].filter(Boolean).join(', ')
}
