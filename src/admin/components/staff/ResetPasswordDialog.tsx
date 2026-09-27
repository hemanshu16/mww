import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { useResetStaffPassword, useStaffDetail } from '@/admin/hooks'
import { applyFieldErrors } from '@/admin/forms'
import { PasswordField } from '@/admin/components/staff/PasswordField'
import { manageBlockReason } from '@/admin/components/staff/staffAccess'
import type { Staff } from '@/admin/types'
import { getApiErrorMessage } from '@/lib/api/client'
import { passwordSchema } from '@/lib/validation'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

export function ResetPasswordDialog({
  staff,
  onOpenChange,
}: {
  staff: Staff | null
  onOpenChange: (open: boolean) => void
}) {
  const { profile: me, permissions } = useStaffAuth()
  const detail = useStaffDetail(staff?.id ?? null)
  const reset = useResetStaffPassword()
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: '' } })

  useEffect(() => {
    if (staff) form.reset({ password: '' })
  }, [staff, form])

  const blocked = detail.data ? manageBlockReason(me, permissions, detail.data) : null

  const onSubmit = async (v: Values) => {
    if (!staff) return
    try {
      await reset.mutateAsync({ id: staff.id, password: v.password })
      toast.success(`Password reset for ${staff.name}. Share it with them securely.`)
      onOpenChange(false)
    } catch (error) {
      applyFieldErrors(form, error, ['password'])
      toast.error(getApiErrorMessage(error, 'Could not reset the password.'))
    }
  }

  return (
    <Dialog open={!!staff} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for {staff?.name}. They&apos;re signed out once their current session
            expires (about 15 minutes).
          </DialogDescription>
        </DialogHeader>

        {detail.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : detail.isError ? (
          <p className="py-4 text-center text-sm text-destructive">
            {getApiErrorMessage(detail.error, "Couldn't load this staff member.")}
          </p>
        ) : blocked ? (
          <>
            <Alert variant="warning">
              <ShieldAlert />
              <AlertDescription>{blocked}.</AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  )
}
