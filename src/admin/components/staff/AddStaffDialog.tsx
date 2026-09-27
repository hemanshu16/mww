import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreateStaff } from '@/admin/hooks'
import { applyFieldErrors } from '@/admin/forms'
import { RolePicker } from '@/admin/components/staff/RolePicker'
import { PasswordField } from '@/admin/components/staff/PasswordField'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { emailSchema, passwordSchema } from '@/lib/validation'
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
  name: z.string().trim().min(1, 'Enter a name').max(100),
  email: emailSchema,
  password: passwordSchema,
  roleIds: z.array(z.string()),
})
type Values = z.infer<typeof schema>

const EMPTY: Values = { name: '', email: '', password: '', roleIds: [] }

export function AddStaffDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const create = useCreateStaff()
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: EMPTY })

  useEffect(() => {
    if (open) form.reset(EMPTY)
  }, [open, form])

  const onSubmit = async (v: Values) => {
    try {
      await create.mutateAsync({
        name: v.name,
        email: v.email,
        password: v.password,
        roleIds: v.roleIds,
      })
      toast.success(`${v.name} added. Share the temporary password with them securely.`)
      onOpenChange(false)
    } catch (error) {
      applyFieldErrors(form, error, ['name', 'email', 'password', 'roleIds'])
      if (error instanceof ApiRequestError && error.status === 409) {
        form.setError('email', { message: error.message })
      }
      toast.error(getApiErrorMessage(error, 'Could not add staff member.'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add staff</DialogTitle>
          <DialogDescription>
            They sign in at the staff login with this email and temporary password.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Priya Shah" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="priya@monarch.com"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel required>Temporary password</FormLabel>
                  <PasswordField
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!fieldState.error}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roles</FormLabel>
                  <FormDescription className="text-[13px]">
                    Their permissions are the combined permissions of these roles.
                  </FormDescription>
                  <RolePicker value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Add staff
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
