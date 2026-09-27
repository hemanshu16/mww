import { Calculator, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatWeight } from '@/lib/format'
import { formatMoney, type RateQuote } from '@/lib/rates'
import { cn } from '@/lib/utils'

export type RateStatus = 'idle' | 'loading' | 'ready' | 'stale'

function ProviderMark({ quote }: { quote: RateQuote }) {
  if (quote.logoUrl) {
    return (
      <img
        src={quote.logoUrl}
        alt=""
        className="size-10 shrink-0 rounded-[10px] border border-border bg-white object-contain p-1"
      />
    )
  }
  const initials = quote.providerName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#eff6ff] text-xs font-bold text-[#21649c]">
      {initials}
    </span>
  )
}

/**
 * Courier choice for step 1: prompt → loading → quotes (radio list). Quotes go
 * stale when the destination or chargeable weight changes after quoting.
 */
export function RateOptions({
  status,
  quotes,
  selectedId,
  onSelect,
  onGetRates,
  destinationName,
  error,
}: {
  status: RateStatus
  quotes: RateQuote[]
  selectedId: string
  onSelect: (quote: RateQuote) => void
  onGetRates: () => void
  destinationName?: string
  error?: string
}) {
  if (status === 'loading') {
    return (
      <div className="space-y-2" aria-busy>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex h-[72px] items-center gap-4 rounded-[12px] border border-border px-4">
            <Skeleton className="size-10 rounded-[10px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (status === 'idle' || status === 'stale') {
    return (
      <div
        className={cn(
          'flex flex-col items-start gap-4 rounded-[12px] border border-dashed px-5 py-5 sm:flex-row sm:items-center sm:justify-between',
          error ? 'border-destructive/50 bg-[#fef2f2]/40' : 'border-[#d5dde8] bg-[#f8fafc]',
        )}
      >
        <div className="text-sm">
          <p className="font-medium text-foreground">
            {status === 'stale' ? 'Your shipment changed' : 'Compare courier prices'}
          </p>
          <p className="mt-0.5 text-muted-foreground">
            {status === 'stale'
              ? 'The destination or weight changed since these rates. Get rates again to choose a courier.'
              : 'Fill in the destination and boxes, then get rates from every courier.'}
          </p>
          {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}
        </div>
        <Button type="button" onClick={onGetRates} className="shrink-0">
          {status === 'stale' ? <RotateCw /> : <Calculator />}
          {status === 'stale' ? 'Get rates again' : 'Get rates'}
        </Button>
      </div>
    )
  }

  if (quotes.length === 0) {
    return (
      <p className="rounded-[12px] border border-border px-5 py-6 text-center text-sm text-muted-foreground">
        No couriers are available for this shipment yet.
      </p>
    )
  }

  const weight = quotes[0].chargeableWeight
  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Courier" className="space-y-2">
        {quotes.map((q, i) => {
          const selected = q.courierProviderId === selectedId
          return (
            <label
              key={q.courierProviderId}
              className={cn(
                'flex cursor-pointer items-center gap-4 rounded-[12px] border px-4 py-3.5 transition-[border-color,background-color,box-shadow] duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/25',
                selected
                  ? 'border-primary bg-[#f6faff] shadow-[0_0_0_1px_var(--primary)]'
                  : 'border-border hover:border-[#b9c9da]',
              )}
            >
              <input
                type="radio"
                name="courier-quote"
                value={q.courierProviderId}
                checked={selected}
                onChange={() => onSelect(q)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  'flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150',
                  selected ? 'border-primary' : 'border-[#c3cfdd]',
                )}
              >
                {selected && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <ProviderMark quote={q} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-[15px] font-semibold text-foreground">{q.providerName}</span>
                  {i === 0 && quotes.length > 1 && <Badge variant="success">Lowest price</Badge>}
                </span>
                <span className="mt-0.5 block text-[13px] tabular-nums text-muted-foreground">
                  {formatMoney(q.ratePerKg)} per kg × {formatWeight(q.chargeableWeight)}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-lg font-semibold tabular-nums tracking-[-0.01em] text-foreground">
                  {formatMoney(q.totalPrice)}
                </span>
              </span>
            </label>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Priced on {formatWeight(weight)} chargeable weight{destinationName ? ` to ${destinationName}` : ''}.
          Sample rates until live pricing is connected.
        </span>
        <button
          type="button"
          onClick={onGetRates}
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <RotateCw className="size-3.5" /> Refresh
        </button>
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}
