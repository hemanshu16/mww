import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Info } from 'lucide-react'
import { useAddWalletTransaction } from '@/admin/hooks'
import { applyFieldErrors } from '@/admin/forms'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { formatINR, todayInput } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { WalletPaymentMode } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MODES: { value: WalletPaymentMode; label: string }[] = [
  { value: 'NEFT', label: 'NEFT' },
  { value: 'RTGS', label: 'RTGS' },
  { value: 'IMPS', label: 'IMPS' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CASH', label: 'Cash' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
]

/** Modes that need a cheque / UTR number. */
const REF_REQUIRED: WalletPaymentMode[] = ['CHEQUE', 'NEFT', 'RTGS', 'IMPS', 'UPI']

const schema = z
  .object({
    type: z.enum(['CREDIT', 'DEBIT']),
    amount: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount with at most 2 decimals')
      .refine((v) => Number(v) > 0, 'Amount must be greater than 0'),
    paymentMode: z.enum(['CHEQUE', 'NEFT', 'RTGS', 'IMPS', 'UPI', 'CASH', 'ADJUSTMENT']),
    referenceNo: z.string().trim().max(100),
    transactionDate: z.string().min(1, 'Pick the date the money moved'),
    note: z.string().trim().max(500),
  })
  .refine((v) => !REF_REQUIRED.includes(v.paymentMode) || v.referenceNo.length > 0, {
    path: ['referenceNo'],
    message: 'Cheque / UTR number is required for this payment mode',
  })
type Values = z.infer<typeof schema>

const FIELDS = ['type', 'amount', 'paymentMode', 'referenceNo', 'transactionDate', 'note'] as const

const defaults = (): Values => ({
  type: 'CREDIT',
  amount: '',
  paymentMode: 'NEFT',
  referenceNo: '',
  transactionDate: todayInput(),
  note: '',
})

export function AddTransactionDialog({
  userId,
  customerName,
  open,
  onOpenChange,
}: {
  userId: string
  customerName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const add = useAddWalletTransaction(userId)
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults() })
  const [type, mode, amount] = useWatch({
    control: form.control,
    name: ['type', 'paymentMode', 'amount'],
  })
  const refRequired = REF_REQUIRED.includes(mode)

  useEffect(() => {
    if (open) form.reset(defaults())
  }, [open, form])

  const onSubmit = async (v: Values) => {
    try {
      await add.mutateAsync({
        type: v.type,
        amount: Number(v.amount),
        paymentMode: v.paymentMode,
        referenceNo: v.referenceNo || undefined,
        transactionDate: v.transactionDate,
        note: v.note || undefined,
      })
      toast.success(
        `${v.type === 'CREDIT' ? 'Credit' : 'Debit'} of ${formatINR(Number(v.amount))} recorded.`,
      )
      onOpenChange(false)
    } catch (error) {
      applyFieldErrors(form, error, FIELDS)
      // Duplicate cheque / UTR number.
      if (error instanceof ApiRequestError && error.status === 409) {
        form.setError('referenceNo', { message: error.message })
      }
      toast.error(getApiErrorMessage(error, 'Could not record the transaction.'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
          <DialogDescription>
            Record a payment or adjustment for {customerName}. Entries can&apos;t be edited later;
            fix mistakes with a reversing entry.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Type</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {(['CREDIT', 'DEBIT'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => field.onChange(t)}
                        className={cn(
                          'h-11 rounded-[8px] border text-sm font-medium transition-colors',
                          field.value === t
                            ? t === 'CREDIT'
                              ? 'border-[#6ee7b7] bg-[#ecfdf5] text-[#047857]'
                              : 'border-[#fca5a5] bg-[#fef2f2] text-[#b91c1c]'
                            : 'border-input bg-card text-muted-foreground hover:bg-[#f8fafc]',
                        )}
                      >
                        {t === 'CREDIT' ? '+ Credit (money in)' : '− Debit (money out)'}
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            {type === 'DEBIT' && (
              <p className="flex items-start gap-2 rounded-[8px] bg-[#fffbeb] px-3 py-2 text-[13px] text-[#92400e]">
                <Info className="mt-0.5 size-4 shrink-0" />
                This will be recorded as an adjustment.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" placeholder="5000.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Transaction date</FormLabel>
                    <FormControl>
                      <Input type="date" max={todayInput()} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Payment mode</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referenceNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required={refRequired}>Cheque / UTR number</FormLabel>
                    <FormControl>
                      <Input placeholder={refRequired ? 'UTR123456789' : 'Optional'} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="e.g. Payment received" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Record {type === 'CREDIT' ? 'credit' : 'debit'}
                {Number(amount) > 0 && ` of ${formatINR(Number(amount))}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
