import { useState } from 'react'
import { Landmark, Plus } from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { useCustomerWallet, useCustomerWalletTransactions } from '@/admin/hooks'
import { AddTransactionDialog } from '@/admin/components/wallet/AddTransactionDialog'
import { CreditLimitDialog } from '@/admin/components/wallet/CreditLimitDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WalletSummaryCards } from '@/components/wallet/WalletSummaryCards'
import { WalletLedger } from '@/components/wallet/WalletLedger'
import { useLedgerParams } from '@/components/wallet/useLedgerParams'

const PAGE_SIZE = 20

/** Summary, ledger, and the payment / credit-limit actions for one customer. */
export function CustomerWalletTab({
  userId,
  customerName,
}: {
  userId: string
  customerName: string
}) {
  const { can } = useStaffAuth()
  const ledger = useLedgerParams()
  const wallet = useCustomerWallet(userId)
  const txns = useCustomerWalletTransactions(userId, {
    page: ledger.page,
    limit: PAGE_SIZE,
    type: ledger.type,
    from: ledger.from,
    to: ledger.to,
  })
  const [addOpen, setAddOpen] = useState(false)
  const [limitOpen, setLimitOpen] = useState(false)
  const w = wallet.data

  if (wallet.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-destructive">
          Couldn&apos;t load this wallet. Please try again.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {w && (can('wallet.credit_limit.update') || can('wallet.transaction.create')) && (
        <div className="flex flex-wrap justify-end gap-2">
          {can('wallet.credit_limit.update') && (
            <Button variant="outline" onClick={() => setLimitOpen(true)}>
              <Landmark className="size-4" /> Edit credit limit
            </Button>
          )}
          {can('wallet.transaction.create') && (
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" /> Add transaction
            </Button>
          )}
        </div>
      )}

      <WalletSummaryCards wallet={w} loading={wallet.isLoading} audience="staff" />

      <WalletLedger
        params={ledger}
        items={txns.data?.items ?? []}
        pagination={txns.data?.pagination}
        isLoading={txns.isLoading}
        isError={txns.isError}
        showRecordedBy
        bookingHref={can('booking.read') ? (id) => `/admin/bookings/${id}` : undefined}
      />

      {w && (
        <>
          <AddTransactionDialog
            userId={userId}
            customerName={customerName}
            open={addOpen}
            onOpenChange={setAddOpen}
          />
          <CreditLimitDialog
            userId={userId}
            balance={w.balance}
            currentLimit={w.creditLimit}
            open={limitOpen}
            onOpenChange={setLimitOpen}
          />
        </>
      )}
    </div>
  )
}
