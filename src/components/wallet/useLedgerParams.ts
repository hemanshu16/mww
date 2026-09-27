import { useSearchParams } from 'react-router-dom'
import type { WalletTxnType } from '@/lib/types'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Ledger filters + page, kept in the URL so they survive reloads and links. */
export function useLedgerParams() {
  const [params, setParams] = useSearchParams()

  const typeParam = params.get('type')
  const type: WalletTxnType | undefined =
    typeParam === 'CREDIT' || typeParam === 'DEBIT' ? typeParam : undefined
  const fromInput = params.get('from') ?? ''
  const toInput = params.get('to') ?? ''
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)

  /** Set or clear params; any filter change goes back to page 1. */
  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    if (!('page' in patch)) next.delete('page')
    setParams(next)
  }

  return {
    type,
    /** Raw input values, for the date fields. */
    fromInput,
    toInput,
    /** Validated values, for the API. */
    from: DATE_RE.test(fromInput) ? fromInput : undefined,
    to: DATE_RE.test(toInput) ? toInput : undefined,
    page,
    filtered: !!(type || fromInput || toInput),
    update,
  }
}

export type LedgerParams = ReturnType<typeof useLedgerParams>
