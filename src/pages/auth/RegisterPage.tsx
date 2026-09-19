import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { register as registerApi } from '@/lib/api/auth'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { emailSchema, passwordChecks, passwordSchema, phoneSchema } from '@/lib/validation'
import { cn } from '@/lib/utils'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  phoneNumber: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
  isGstBilling: z.boolean(),
})
type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
      phoneNumber: '',
      email: '',
      password: '',
      isGstBilling: false,
    },
  })

  const password = form.watch('password')

  const onSubmit = async (values: FormValues) => {
    try {
      await registerApi(values)
      toast.success('Account created. Check your email for a verification code.')
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}`)
    } catch (error) {
      if (error instanceof ApiRequestError && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field in values) form.setError(field as keyof FormValues, { message })
        }
      }
      toast.error(getApiErrorMessage(error, 'Unable to create account.'))
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start booking international shipments in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
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
                    <Input autoComplete="given-name" {...field} />
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
                    <Input autoComplete="family-name" {...field} />
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
                  <Input autoComplete="organization" {...field} />
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
                <FormLabel required>Phone number</FormLabel>
                <FormControl>
                  <Input type="tel" autoComplete="tel" placeholder="+919876543210" {...field} />
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
                <FormLabel required>Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} />
                </FormControl>
                <ul className="mt-2 grid grid-cols-2 gap-1.5">
                  {passwordChecks.map((check) => {
                    const ok = check.test(password)
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
            name="isGstBilling"
            render={({ field }) => (
              <FormItem>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
                  <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                  <span className="text-sm">
                    <span className="font-medium">Enable GST billing</span>
                    <span className="block text-xs text-muted-foreground">
                      Invoices will include GST where applicable.
                    </span>
                  </span>
                </label>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Create account
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
