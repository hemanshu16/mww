import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useUpdateCreditLimit } from '@/admin/hooks'
import { applyFieldErrors } from '@/admin/forms'
import { getApiErrorMessage } from '@/lib/api/client'
import { formatINR } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const schema = z.object({
  creditLimit: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter 0 or more, with at most 2 decimals'),
})
type Values = z.infer<typeof schema>

export function CreditLimitDialog({
  userId,
  balance,
  currentLimit,
  open,
  onOpenChange,
}: {
  userId: string
  balance: number
  currentLimit: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const update = useUpdateCreditLimit(userId)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { creditLimit: String(currentLimit) },
  })
  const draft = useWatch({ control: form.control, name: 'creditLimit' })
  const draftValid = /^\d+(\.\d{1,2})?$/.test(draft?.trim() ?? '')

  useEffect(() => {
    if (open) form.reset({ creditLimit: String(currentLimit) })
  }, [open, currentLimit, form])

  const onSubmit = async (v: Values) => {
    try {
      await update.mutateAsync(Number(v.creditLimit))
      toast.success(`Credit limit set to ${formatINR(Number(v.creditLimit))}.`)
      onOpenChange(false)
    } catch (error) {
      applyFieldErrors(form, error, ['creditLimit'])
      toast.error(getApiErrorMessage(error, 'Could not update the credit limit.'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit credit limit</DialogTitle>
          <DialogDescription>
            How far below zero this customer&apos;s balance may go when booking.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Credit limit (₹)</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" autoFocus {...field} />
                  </FormControl>
                  <FormDescription>
                    {draftValid
                      ? `Available to book becomes ${formatINR(balance + Number(draft))}.`
                      : `Current limit: ${formatINR(currentLimit)}.`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Save limit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
