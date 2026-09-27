import { Check, Copy, Info, Landmark, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { usePaymentDetails } from '@/hooks/usePaymentDetails'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { PaymentBankAccount } from '@/lib/types'

/** 50200012345678 → "5020 0012 3456 78" for reading; copy uses the raw value. */
function groupDigits(n: string) {
  return n.replace(/(.{4})(?=.)/g, '$1 ')
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`${label} copied`)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy. Please select and copy it manually.')
    }
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0"
      onClick={copy}
      aria-label={`Copy ${label.toLowerCase()}`}
    >
      {copied ? <Check className="size-4 text-[#047857]" /> : <Copy className="size-4" />}
    </Button>
  )
}

function DetailRow({
  label,
  display,
  value,
  mono,
}: {
  label: string
  display?: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 shrink-0 text-[13px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          'min-w-0 flex-1 break-words text-sm font-medium text-foreground',
          mono && 'font-mono tabular-nums',
        )}
      >
        {display ?? value}
      </span>
      <CopyButton value={value} label={label} />
    </div>
  )
}

function AccountCard({ account }: { account: PaymentBankAccount }) {
  return (
    <div className="rounded-[12px] border border-border p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Landmark className="size-4 text-primary" />
        {account.bankName}
        {account.branchName && (
          <span className="font-normal text-muted-foreground">· {account.branchName}</span>
        )}
      </p>
      <div className="mt-2 divide-y divide-border">
        <DetailRow label="Account name" value={account.accountName} />
        <DetailRow
          label="Account number"
          value={account.accountNumber}
          display={groupDigits(account.accountNumber)}
          mono
        />
        <DetailRow label="IFSC" value={account.ifscCode} mono />
      </div>
    </div>
  )
}

/** Where customers transfer money to top up their wallet. */
export function PaymentDetailsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data, isLoading, isError, refetch, isFetching } = usePaymentDetails(open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pay by bank transfer</DialogTitle>
          <DialogDescription>
            Transfer the amount to any account below. Your wallet is credited once our team confirms
            the payment.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : isError || !data ? (
          <div className="py-6 text-center">
            <p className="text-sm text-destructive">Couldn&apos;t load bank details, try again.</p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => refetch()}
              loading={isFetching}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(data.legalName || data.gstNumber) && (
              <div className="rounded-[12px] bg-[#f8fafc] px-4 py-3">
                {data.legalName && (
                  <p className="text-sm font-semibold text-foreground">{data.legalName}</p>
                )}
                {data.gstNumber && (
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-muted-foreground">
                      GSTIN: <span className="font-mono text-foreground">{data.gstNumber}</span>
                    </span>
                    <CopyButton value={data.gstNumber} label="GSTIN" />
                  </div>
                )}
              </div>
            )}

            {data.bankAccounts.length === 0 ? (
              <p className="rounded-[12px] border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Bank details are not available right now. Please contact support.
              </p>
            ) : (
              data.bankAccounts.map((a) => (
                <AccountCard key={`${a.ifscCode}-${a.accountNumber}`} account={a} />
              ))
            )}

            <p className="flex items-start gap-2 text-[13px] text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              After paying, share the UTR / cheque number with our team. Crediting isn&apos;t
              instant: your balance updates once the payment is verified.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
