import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/AuthLayout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { staffLogin } from '@/admin/api'
import { getApiErrorMessage } from '@/lib/api/client'
import { hasSession } from '@/lib/session'
import { emailSchema } from '@/lib/validation'

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.infer<typeof schema>

export default function AdminLoginPage() {
  const { status, signIn } = useStaffAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/admin'
  const customerSignedIn = hasSession('customer')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (status === 'authenticated') navigate(from, { replace: true })
  }, [status, from, navigate])

  const onSubmit = async (values: FormValues) => {
    try {
      const auth = await staffLogin(values.email, values.password)
      signIn(auth)
      toast.success(`Welcome back, ${auth.profile.name.split(' ')[0]}`)
    } catch (error) {
      // 401 bad credentials, 403 deactivated — both messages are shown as returned.
      toast.error(getApiErrorMessage(error, 'Unable to sign in.'))
    }
  }

  return (
    <AuthLayout
      title="Staff sign in"
      subtitle="Monarch operations and admin console."
      panelTitle="Monarch operations console."
      panelText="Manage customer wallets, courier providers, destinations, and your team's access, all in one place."
      footer={
        <>
          Not staff?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Customer sign in
          </Link>
        </>
      }
    >
      {customerSignedIn && (
        <Alert variant="info" className="mb-5">
          <AlertDescription>
            You&apos;re signed in as a customer. Signing in as staff will sign you out of that
            account.
          </AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@monarch.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Sign in
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
