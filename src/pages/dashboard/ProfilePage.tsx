import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { updateMe } from '@/lib/api/users'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { passwordChecks, passwordSchema } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { cn } from '@/lib/utils'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().min(1, 'Company name is required'),
})
type ProfileValues = z.infer<typeof profileSchema>

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
type PasswordValues = z.infer<typeof passwordFormSchema>

function ProfileForm() {
  const { profile, setProfile } = useAuth()
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      companyName: profile?.companyName ?? '',
    },
  })

  const onSubmit = async (values: ProfileValues) => {
    try {
      const updated = await updateMe(values)
      setProfile(updated)
      toast.success('Profile updated.')
      form.reset(values)
    } catch (error) {
      if (error instanceof ApiRequestError && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field in values) form.setError(field as keyof ProfileValues, { message })
        }
      }
      toast.error(getApiErrorMessage(error, 'Could not update profile.'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile details</CardTitle>
        <CardDescription>Update your name and company information.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Company name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FormLabel className="text-muted-foreground">Email</FormLabel>
                <p className="mt-1.5 text-sm">{profile?.email}</p>
              </div>
              <div>
                <FormLabel className="text-muted-foreground">Phone</FormLabel>
                <p className="mt-1.5 text-sm">{profile?.phoneNumber}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={form.formState.isSubmitting} disabled={!form.formState.isDirty}>
                Save changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function PasswordForm() {
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordFormSchema),
    mode: 'onChange',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const newPassword = form.watch('newPassword')

  const onSubmit = async (values: PasswordValues) => {
    try {
      await updateMe({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      toast.success('Password changed.')
      form.reset({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        form.setError('currentPassword', { message: 'Current password is incorrect' })
      }
      toast.error(getApiErrorMessage(error, 'Could not change password.'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Use a strong, unique password.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Current password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>New password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <ul className="mt-2 grid grid-cols-2 gap-1.5">
                    {passwordChecks.map((check) => {
                      const ok = check.test(newPassword)
                      return (
                        <li
                          key={check.label}
                          className={cn(
                            'flex items-center gap-1.5 text-xs',
                            ok ? 'text-success' : 'text-muted-foreground',
                          )}
                        >
                          {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                          {check.label}
                        </li>
                      )
                    })}
                  </ul>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Confirm new password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={form.formState.isSubmitting}>
                Update password
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default function ProfilePage() {
  const { profile } = useAuth()
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-2xl tracking-tight">Profile</h1>
        {profile?.isGstBilling && <Badge variant="gold">GST billing</Badge>}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  )
}
