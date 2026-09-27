import { useQuery } from '@tanstack/react-query'
import { getWallet, listWalletTransactions, type ListWalletTxnParams } from '@/lib/api/wallet'
import { queryKeys } from '@/lib/queryKeys'

export function useWallet() {
  return useQuery({
    queryKey: queryKeys.wallet,
    queryFn: getWallet,
  })
}

export function useWalletTransactions(params: ListWalletTxnParams) {
  return useQuery({
    queryKey: queryKeys.walletTransactions(params),
    queryFn: () => listWalletTransactions(params),
    placeholderData: (prev) => prev,
  })
}
