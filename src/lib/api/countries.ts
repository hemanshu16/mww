import { apiClient } from '@/lib/api/client'
import type { Country, CountryInput, CountryList } from '@/lib/types'

export interface ListCountriesParams {
  page?: number
  limit?: number
  search?: string
  sortOrder?: 'asc' | 'desc'
  isVisible?: boolean
}

export function listCountries(params: ListCountriesParams = {}) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.search) qs.set('search', params.search)
  if (params.sortOrder) qs.set('sortOrder', params.sortOrder)
  if (params.isVisible !== undefined) qs.set('isVisible', String(params.isVisible))
  const query = qs.toString()
  return apiClient.get<CountryList>(`/admin/countries${query ? `?${query}` : ''}`)
}

/** Customer-facing list: only the countries open for booking. */
export function listBookableCountries() {
  return apiClient.get<CountryList>('/countries?limit=300&sortOrder=asc')
}

export function getCountry(id: string) {
  return apiClient.get<Country>(`/admin/countries/${id}`)
}

export function createCountry(input: CountryInput) {
  return apiClient.post<Country>('/admin/countries', input)
}

/** Send only the fields that changed — the API rejects an empty body. */
export function updateCountry(id: string, input: Partial<CountryInput>) {
  return apiClient.patch<Country>(`/admin/countries/${id}`, input)
}

export function deleteCountry(id: string) {
  return apiClient.delete<null>(`/admin/countries/${id}`)
}
