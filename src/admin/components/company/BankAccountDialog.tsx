import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreateBankAccount, useUpdateBankAccount } from '@/admin/hooks'
import { applyFieldErrors } from '@/admin/forms'
import type { BankAccount, BankAccountInput } from '@/admin/types'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/
const ACCOUNT_RE = /^[0-9]{9,18}$/

function makeSchema(isEdit: boolean) {
  return z
    .object({
      bankName: z.string().trim().min(1, 'Enter the bank name'),
      accountName: z.string().trim().min(1, 'Enter the name the account is held in'),
      accountNumber: z.string().trim().regex(ACCOUNT_RE, 'Account number must be 9 to 18 digits'),
      confirmAccountNumber: z.string().trim(),
      ifscCode: z.string().trim().regex(IFSC_RE, 'Enter a valid 11-character IFSC code'),
      branchName: z.string().trim(),
      isActive: z.boolean(),
    })
    .refine((v) => isEdit || v.confirmAccountNumber === v.accountNumber, {
      path: ['confirmAccountNumber'],
      message: "Account numbers don't match",
    })
}
type Values = z.infer<ReturnType<typeof makeSchema>>

const FIELDS = [
  'bankName',
  'accountName',
  'accountNumber',
  'ifscCode',
  'branchName',
  'isActive',
] as const

function toValues(a: BankAccount | null): Values {
  return {
    bankName: a?.bankName ?? '',
    accountName: a?.accountName ?? '',
    accountNumber: a?.accountNumber ?? '',
    confirmAccountNumber: '',
    ifscCode: a?.ifscCode ?? '',
    branchName: a?.branchName ?? '',
    isActive: a?.isActive ?? true,
  }
}

export function BankAccountDialog({
  open,
  onOpenChange,
  account,
  legalName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Edit this account; null to add one. */
  account: BankAccount | null
  /** For "Use company legal name". */
  legalName?: string | null
}) {
  const isEdit = !!account
  const schema = useMemo(() => makeSchema(isEdit), [isEdit])
  const create = useCreateBankAccount()
  const update = useUpdateBankAccount()
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(account) })

  useEffect(() => {
    if (open) form.reset(toValues(account))
  }, [open, account, form])

  const onSubmit = async (v: Values) => {
    try {
      if (account) {
        // PATCH only what changed; an emptied branch is sent as null to clear it.
        const next: Partial<BankAccountInput> = {
          bankName: v.bankName,
          accountName: v.accountName,
          accountNumber: v.accountNumber,
          ifscCode: v.ifscCode,
          branchName: v.branchName || null,
        }
        const diff: Partial<BankAccountInput> = {}
        for (const key of Object.keys(next) as (keyof BankAccountInput)[]) {
          if (next[key] !== account[key]) (diff as Record<string, unknown>)[key] = next[key]
        }
        if (Object.keys(diff).length === 0) {
          onOpenChange(false)
          return
        }
        await update.mutateAsync({ id: account.id, input: diff })
        toast.success('Bank account updated.')
      } else {
        await create.mutateAsync({
          bankName: v.bankName,
          accountName: v.accountName,
          accountNumber: v.accountNumber,
          ifscCode: v.ifscCode,
          branchName: v.branchName || undefined,
          isActive: v.isActive,
        })
        toast.success('Bank account added.')
      }
      onOpenChange(false)
    } catch (error) {
      applyFieldErrors(form, error, FIELDS)
      // Duplicate IFSC + account number.
      if (error instanceof ApiRequestError && error.status === 409) {
        form.setError('accountNumber', { message: error.message })
      }
      toast.error(getApiErrorMessage(error, 'Could not save the bank account.'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit bank account' : 'Add bank account'}</DialogTitle>
          <DialogDescription>
            Customers transfer money to this account, so double-check every detail.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Bank name</FormLabel>
                    <FormControl>
                      <Input placeholder="HDFC Bank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch name</FormLabel>
                    <FormControl>
                      <Input placeholder="CG Road, Ahmedabad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel required>Account name</FormLabel>
                    {legalName && (
                      <button
                        type="button"
                        onClick={() =>
                          form.setValue('accountName', legalName, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Use company legal name
                      </button>
                    )}
                  </div>
                  <FormControl>
                    <Input placeholder="ASTHA INTERNATIONAL COURIER PVT. LTD." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Account number</FormLabel>
                    <FormControl>
                      {/* Text, never type=number: leading zeros must survive. */}
                      <Input
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={18}
                        placeholder="50200012345678"
                        className="font-mono"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/\s/g, ''))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEdit && (
                <FormField
                  control={form.control}
                  name="confirmAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Confirm account number</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={18}
                          className="font-mono"
                          onPaste={(e) => e.preventDefault()}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.replace(/\s/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="ifscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>IFSC code</FormLabel>
                    <FormControl>
                      <Input
                        maxLength={11}
                        autoComplete="off"
                        placeholder="HDFC0001234"
                        className="font-mono uppercase"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-start justify-between gap-6 space-y-0 rounded-[10px] border border-border p-4">
                    <div className="space-y-1">
                      <FormLabel>Active</FormLabel>
                      <FormDescription className="text-[13px]">
                        Active accounts are shown to customers.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                {isEdit ? 'Save changes' : 'Add account'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
