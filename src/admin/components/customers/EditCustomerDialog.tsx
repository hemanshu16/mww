import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { useUpdateCustomer } from '@/admin/hooks'
import { applyFieldErrors } from '@/admin/forms'
import type { Customer, UpdateCustomerInput } from '@/admin/types'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { emailSchema, phoneSchema } from '@/lib/validation'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

const schema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  companyName: z.string().trim().min(1, 'Company name is required'),
  phoneNumber: phoneSchema,
  email: emailSchema,
  isGstBilling: z.boolean(),
  isEmailVerified: z.boolean(),
})
type Values = z.infer<typeof schema>
const FIELDS = Object.keys(schema.shape) as (keyof Values)[]

const toValues = (c: Customer): Values => ({
  firstName: c.firstName,
  lastName: c.lastName,
  companyName: c.companyName,
  phoneNumber: c.phoneNumber,
  email: c.email,
  isGstBilling: c.isGstBilling,
  isEmailVerified: c.isEmailVerified,
})

export function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const update = useUpdateCustomer(customer.id)
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(customer) })
  const [email, verified] = useWatch({ control: form.control, name: ['email', 'isEmailVerified'] })
  const emailChanged = email.trim().toLowerCase() !== customer.email.toLowerCase()
  const verifiedTouched = verified !== customer.isEmailVerified

  useEffect(() => {
    if (open) form.reset(toValues(customer))
  }, [open, customer, form])

  const onSubmit = async (v: Values) => {
    const before = toValues(customer)
    const input: UpdateCustomerInput = {}
    for (const key of FIELDS) {
      const next = typeof v[key] === 'string' ? (v[key] as string).trim() : v[key]
      if (next !== before[key]) (input as Record<string, unknown>)[key] = next
    }
    if (Object.keys(input).length === 0) {
      onOpenChange(false)
      return
    }
    try {
      await update.mutateAsync(input)
      toast.success('Customer updated.')
      onOpenChange(false)
    } catch (error) {
      applyFieldErrors(form, error, FIELDS)
      if (error instanceof ApiRequestError && error.status === 409) {
        form.setError('email', { message: error.message })
      }
      toast.error(getApiErrorMessage(error, 'Could not update the customer.'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit customer</DialogTitle>
          <DialogDescription>
            {customer.firstName} {customer.lastName} · {customer.companyName}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Company</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Phone</FormLabel>
                    <FormControl>
                      <Input inputMode="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {emailChanged && !verifiedTouched && (
              <Alert variant="warning">
                <AlertTriangle />
                <AlertDescription>
                  Changing the email marks the customer unverified. Turn on “Email verified” below
                  to keep them verified.
                </AlertDescription>
              </Alert>
            )}
            <div className="divide-y divide-border rounded-[10px] border border-border">
              <FormField
                control={form.control}
                name="isEmailVerified"
                render={({ field }) => (
                  <FormItem className="flex items-start justify-between gap-6 space-y-0 p-4">
                    <div className="space-y-1">
                      <FormLabel>Email verified</FormLabel>
                      <FormDescription className="text-[13px]">
                        Verify manually if the customer can&apos;t receive the code.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isGstBilling"
                render={({ field }) => (
                  <FormItem className="flex items-start justify-between gap-6 space-y-0 p-4">
                    <div className="space-y-1">
                      <FormLabel>GST billing</FormLabel>
                      <FormDescription className="text-[13px]">
                        Bill this customer with GST.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
