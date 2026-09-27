import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, Landmark } from 'lucide-react'
import { useWallet, useWalletTransactions } from '@/hooks/useWallet'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { WalletSummaryCards } from '@/components/wallet/WalletSummaryCards'
import { WalletLedger } from '@/components/wallet/WalletLedger'
import { PaymentDetailsDialog } from '@/components/wallet/PaymentDetailsDialog'
import { useLedgerParams } from '@/components/wallet/useLedgerParams'

const PAGE_SIZE = 20

export default function PaymentsPage() {
  const ledger = useLedgerParams()
  const wallet = useWallet()
  const txns = useWalletTransactions({
    page: ledger.page,
    limit: PAGE_SIZE,
    type: ledger.type,
    from: ledger.from,
    to: ledger.to,
  })

  // `?pay=1` (linked from elsewhere) opens the bank details straight away.
  const [params, setParams] = useSearchParams()
  const [payOpen, setPayOpen] = useState(() => params.get('pay') === '1')
  const onPayOpenChange = (open: boolean) => {
    setPayOpen(open)
    if (!open && params.has('pay')) {
      const next = new URLSearchParams(params)
      next.delete('pay')
      setParams(next, { replace: true })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Your wallet balance and payment history."
        actions={
          <Button onClick={() => setPayOpen(true)}>
            <Landmark className="size-4" /> Add funds
          </Button>
        }
      />

      {wallet.isError ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-sm text-destructive">
            <AlertCircle className="size-4" /> Couldn&apos;t load your wallet. Please try again.
          </CardContent>
        </Card>
      ) : (
        <WalletSummaryCards wallet={wallet.data} loading={wallet.isLoading} />
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#eff6ff] text-primary">
              <Landmark className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Pay by bank transfer</p>
              <p className="text-[13px] text-muted-foreground">
                Transfer to our bank account to top up your wallet. It&apos;s credited once our team
                confirms the payment.
              </p>
            </div>
          </div>
          <Button variant="outline" className="shrink-0" onClick={() => setPayOpen(true)}>
            View bank details
          </Button>
        </CardContent>
      </Card>

      <WalletLedger
        params={ledger}
        items={txns.data?.items ?? []}
        pagination={txns.data?.pagination}
        isLoading={txns.isLoading}
        isError={txns.isError}
        bookingHref={(id) => `/dashboard/bookings/${id}`}
      />

      <PaymentDetailsDialog open={payOpen} onOpenChange={onPayOpenChange} />
    </div>
  )
}
