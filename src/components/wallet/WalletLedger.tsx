import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ReceiptText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import type { LedgerParams } from '@/components/wallet/useLedgerParams'
import { formatDate, formatDateTime, formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  WALLET_CATEGORY_LABELS,
  type Pagination,
  type WalletTransaction,
  type WalletTxnType,
} from '@/lib/types'

const TYPE_TABS: { value: WalletTxnType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'CREDIT', label: 'Credits' },
  { value: 'DEBIT', label: 'Debits' },
]

function Description({
  txn,
  bookingHref,
}: {
  txn: WalletTransaction
  bookingHref?: (bookingId: string) => string
}) {
  const label = WALLET_CATEGORY_LABELS[txn.category] ?? txn.category
  // Skip notes that just repeat the category label.
  const note = txn.note && txn.note.toLowerCase() !== label.toLowerCase() ? txn.note : null
  return (
    <div className="min-w-0">
      <div className="font-medium text-foreground">{label}</div>
      {txn.bookingNumber ? (
        txn.bookingId && bookingHref ? (
          <Link
            to={bookingHref(txn.bookingId)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {txn.bookingNumber}
          </Link>
        ) : (
          <div className="text-xs font-medium text-[#526581]">{txn.bookingNumber}</div>
        )
      ) : note ? (
        <div className="max-w-[260px] truncate text-xs text-muted-foreground" title={note}>
          {note}
        </div>
      ) : null}
    </div>
  )
}

function LedgerFilters({ params }: { params: LedgerParams }) {
  const { type, fromInput, toInput, filtered, update } = params
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="inline-flex w-fit gap-1 rounded-[10px] border border-border bg-card p-1">
        {TYPE_TABS.map((tab) => {
          const active = (tab.value === 'ALL' && !type) || tab.value === type
          return (
            <button
              key={tab.value}
              onClick={() => update({ type: tab.value === 'ALL' ? undefined : tab.value })}
              className={cn(
                'rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors duration-150',
                active
                  ? 'bg-[#eff6ff] text-[#21649c]'
                  : 'text-muted-foreground hover:bg-[#f8fafc] hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="txn-from" className="text-xs">
            From
          </Label>
          <Input
            id="txn-from"
            type="date"
            className="h-10 w-[160px]"
            value={fromInput}
            max={toInput || undefined}
            onChange={(e) => update({ from: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="txn-to" className="text-xs">
            To
          </Label>
          <Input
            id="txn-to"
            type="date"
            className="h-10 w-[160px]"
            value={toInput}
            min={fromInput || undefined}
            onChange={(e) => update({ to: e.target.value })}
          />
        </div>
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10"
            onClick={() => update({ type: undefined, from: undefined, to: undefined })}
          >
            <X className="size-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  )
}

/** Ledger filters + table + pagination. Newest entries first. */
export function WalletLedger({
  params,
  items,
  pagination,
  isLoading,
  isError,
  bookingHref,
  showRecordedBy,
}: {
  params: LedgerParams
  items: WalletTransaction[]
  pagination?: Pagination
  isLoading: boolean
  isError: boolean
  /** Link booking numbers to this page; plain text when omitted. */
  bookingHref?: (bookingId: string) => string
  /** Staff view: who recorded each entry ("System" for booking debits). */
  showRecordedBy?: boolean
}) {
  const columns = showRecordedBy ? 7 : 6
  const { page, filtered, update } = params

  return (
    <div className="space-y-4">
      <LedgerFilters params={params} />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Mode / Ref</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Balance</TableHead>
              {showRecordedBy && (
                <TableHead className="hidden xl:table-cell">Recorded by</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: columns }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns} className="py-12 text-center text-sm text-destructive">
                  Couldn&apos;t load transactions. Please try again.
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns} className="p-0">
                  <EmptyState
                    icon={ReceiptText}
                    title={filtered ? 'No matching transactions' : 'No transactions yet'}
                    description={
                      filtered
                        ? 'Try a different type or date range.'
                        : 'Payments received and booking charges will appear here.'
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((t) => {
                const credit = t.type === 'CREDIT'
                return (
                  <TableRow key={t.id}>
                    <TableCell
                      className="whitespace-nowrap text-sm"
                      title={`Recorded ${formatDateTime(t.createdAt)}`}
                    >
                      {formatDate(t.transactionDate)}
                    </TableCell>
                    <TableCell>
                      <Description txn={t} bookingHref={bookingHref} />
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {t.paymentMode || t.referenceNo ? (
                        <>
                          {t.paymentMode ?? '—'}
                          {t.referenceNo && (
                            <span className="block text-xs tabular-nums">{t.referenceNo}</span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-[#047857]">
                      {credit ? `+${formatINR(t.amount)}` : ''}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-[#b91c1c]">
                      {credit ? '' : `−${formatINR(t.amount)}`}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'hidden text-right tabular-nums sm:table-cell',
                        t.balanceAfter < 0 && 'text-[#b91c1c]',
                      )}
                    >
                      {formatINR(t.balanceAfter)}
                    </TableCell>
                    {showRecordedBy && (
                      <TableCell className="hidden text-sm xl:table-cell">
                        {t.createdBy ? (
                          <>
                            {t.createdBy.name}
                            <span className="block text-xs text-muted-foreground">
                              {formatDateTime(t.createdAt)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) })}
              >
                <ChevronLeft className="size-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => update({ page: String(page + 1) })}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
