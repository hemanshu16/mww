import { apiClient } from '@/lib/api/client'
import type { WalletSummary, WalletTransactionList, WalletTxnType } from '@/lib/types'

export interface ListWalletTxnParams {
  page?: number
  limit?: number
  type?: WalletTxnType
  /** YYYY-MM-DD (inclusive). */
  from?: string
  /** YYYY-MM-DD (inclusive — sent as end of that day). */
  to?: string
}

export function getWallet() {
  return apiClient.get<WalletSummary>('/wallet')
}

export function listWalletTransactions(params: ListWalletTxnParams = {}) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.type) qs.set('type', params.type)
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', `${params.to}T23:59:59.999Z`)
  const query = qs.toString()
  return apiClient.get<WalletTransactionList>(`/wallet/transactions${query ? `?${query}` : ''}`)
}
