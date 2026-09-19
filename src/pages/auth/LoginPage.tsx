import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuth } from '@/hooks/useAuth'
import { login } from '@/lib/api/auth'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { emailSchema } from '@/lib/validation'

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const { status, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (status === 'authenticated') navigate(from, { replace: true })
  }, [status, from, navigate])

  const onSubmit = async (values: FormValues) => {
    try {
      const session = await login(values.email, values.password)
      signIn(session)
      toast.success(`Welcome back, ${session.profile.firstName}`)
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 403) {
        toast.info('Please verify your email to continue.')
        navigate(`/verify-email?email=${encodeURIComponent(values.email)}`)
        return
      }
      toast.error(getApiErrorMessage(error, 'Unable to sign in.'))
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access your bookings and shipments."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="you@company.com" {...field} />
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
                <div className="flex items-center justify-between">
                  <FormLabel required>Password</FormLabel>
                  <span className="text-xs text-muted-foreground">Forgot?</span>
                </div>
                <FormControl>
                  <Input type="password" autoComplete="current-password" placeholder="••••••••" {...field} />
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
