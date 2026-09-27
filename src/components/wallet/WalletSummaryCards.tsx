import { AlertCircle, CreditCard, Landmark, Wallet, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { WalletSummary } from '@/lib/types'

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconTone,
  valueTone,
  caption,
  loading,
}: {
  label: string
  value: string
  icon: LucideIcon
  iconTone: string
  valueTone?: string
  caption?: React.ReactNode
  loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className={cn('flex size-10 items-center justify-center rounded-[10px]', iconTone)}>
          <Icon className="size-5" />
        </div>
        <p className="mt-4 text-[13px] font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-1.5 h-8 w-28" />
        ) : (
          <p
            className={cn(
              'mt-1 text-[26px] font-bold leading-[34px] tracking-[-0.02em] tabular-nums text-foreground',
              valueTone,
            )}
          >
            {value}
          </p>
        )}
        {caption && !loading && (
          <div className="mt-1 text-[13px] text-muted-foreground">{caption}</div>
        )}
      </CardContent>
    </Card>
  )
}

/** Balance, Available to book, Credit limit, and Outstanding when above 0. */
export function WalletSummaryCards({
  wallet,
  loading,
  audience = 'customer',
}: {
  wallet: WalletSummary | undefined
  loading?: boolean
  audience?: 'customer' | 'staff'
}) {
  const negative = (wallet?.balance ?? 0) < 0
  const owes = !!wallet && wallet.outstandingAmount > 0

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', owes ? 'xl:grid-cols-4' : 'xl:grid-cols-3')}>
      <SummaryCard
        label={negative ? 'Balance (Due)' : 'Wallet balance'}
        value={formatINR(wallet?.balance)}
        icon={Wallet}
        iconTone={negative ? 'bg-[#fef2f2] text-[#b91c1c]' : 'bg-[#eff6ff] text-primary'}
        valueTone={negative ? 'text-[#b91c1c]' : undefined}
        caption={
          negative
            ? audience === 'customer'
              ? 'You have booked on credit'
              : 'Booked on credit'
            : undefined
        }
        loading={loading}
      />
      <SummaryCard
        label="Available to book"
        value={formatINR(wallet?.availableBalance)}
        icon={CreditCard}
        iconTone="bg-[#ecfdf5] text-[#047857]"
        caption="Balance + credit limit"
        loading={loading}
      />
      <SummaryCard
        label="Credit limit"
        value={formatINR(wallet?.creditLimit)}
        icon={Landmark}
        iconTone="bg-[#f1f5f9] text-[#475569]"
        loading={loading}
      />
      {owes && (
        <SummaryCard
          label="Outstanding"
          value={formatINR(wallet.outstandingAmount)}
          icon={AlertCircle}
          iconTone="bg-[#fffbeb] text-[#b45309]"
          valueTone="text-[#b45309]"
          caption={audience === 'customer' ? 'Amount owed to Monarch' : 'Amount owed by customer'}
        />
      )}
    </div>
  )
}
