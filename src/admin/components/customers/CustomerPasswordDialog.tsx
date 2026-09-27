import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useResetCustomerPassword } from '@/admin/hooks'
import { applyFieldErrors } from '@/admin/forms'
import { PasswordField } from '@/admin/components/staff/PasswordField'
import type { Customer } from '@/admin/types'
import { getApiErrorMessage } from '@/lib/api/client'
import { passwordSchema } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const schema = z.object({ password: passwordSchema })
type Values = z.infer<typeof schema>

export function CustomerPasswordDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const reset = useResetCustomerPassword(customer.id)
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: '' } })

  useEffect(() => {
    if (open) form.reset({ password: '' })
  }, [open, form])

  const onSubmit = async (v: Values) => {
    try {
      await reset.mutateAsync(v.password)
      toast.success(`Password reset for ${customer.firstName}. Share it with them securely.`)
      onOpenChange(false)
    } catch (error) {
      applyFieldErrors(form, error, ['password'])
      toast.error(getApiErrorMessage(error, 'Could not reset the password.'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for {customer.firstName} {customer.lastName}. They&apos;re signed out
            on every device once their current session expires (about 15 minutes).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel required>New password</FormLabel>
                  <PasswordField
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!fieldState.error}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Reset password
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
