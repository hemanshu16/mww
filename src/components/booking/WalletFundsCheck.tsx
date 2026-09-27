import { useState } from 'react'
import { AlertTriangle, Wallet } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { PaymentDetailsDialog } from '@/components/wallet/PaymentDetailsDialog'
import { isShortOfFunds } from '@/hooks/useBookings'
import { formatINR } from '@/lib/format'
import type { WalletSummary } from '@/lib/types'

/** "Price ₹X · Available ₹Y" line shown before a booking is submitted. */
export function WalletFundsCheck({
  price,
  wallet,
  loading,
}: {
  price: number | null
  wallet: WalletSummary | undefined
  loading?: boolean
}) {
  const [payOpen, setPayOpen] = useState(false)

  if (loading) return <Skeleton className="h-14 w-full" />
  if (!wallet) return null

  if (isShortOfFunds(price, wallet)) {
    return (
      <>
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Insufficient wallet balance</AlertTitle>
          <AlertDescription>
            This booking costs {formatINR(price)} but only {formatINR(wallet.availableBalance)} is
            available to book. Add funds by bank transfer, or contact your Monarch account manager,
            then submit again.{' '}
            <button
              type="button"
              onClick={() => setPayOpen(true)}
              className="font-medium underline underline-offset-2"
            >
              View bank details to add funds
            </button>
          </AlertDescription>
        </Alert>
        <PaymentDetailsDialog open={payOpen} onOpenChange={setPayOpen} />
      </>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[10px] border border-border bg-card px-4 py-3 text-sm">
      <Wallet className="size-4 text-primary" />
      <span>
        Price <span className="font-semibold tabular-nums">{formatINR(price)}</span>
      </span>
      <span className="text-muted-foreground">·</span>
      <span>
        Available{' '}
        <span className="font-semibold tabular-nums text-[#047857]">
          {formatINR(wallet.availableBalance)}
        </span>
      </span>
      <span className="text-xs text-muted-foreground">
        The price is debited from your wallet on submit.
      </span>
    </div>
  )
}
