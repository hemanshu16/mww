import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { useCreateCustomer } from '@/admin/hooks'
import { applyFieldErrors } from '@/admin/forms'
import { PasswordField } from '@/admin/components/staff/PasswordField'
import type { CreateCustomerInput } from '@/admin/types'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { emailSchema, passwordSchema, PHONE_REGEX } from '@/lib/validation'
import { cn } from '@/lib/utils'
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

/** "+91 98765-43210" → "+919876543210": the API takes digits only. */
const compactPhone = (v: string) => v.replace(/[\s-]/g, '')

const schema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    companyName: z.string().trim().min(1, 'Company name is required'),
    phoneNumber: z
      .string()
      .refine(
        (v) => PHONE_REGEX.test(compactPhone(v)),
        'Enter a valid phone number (7–15 digits, optional +)',
      ),
    email: emailSchema,
    isGstBilling: z.boolean(),
    passwordMode: z.enum(['generate', 'set']),
    password: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.passwordMode !== 'set') return
    const result = passwordSchema.safeParse(v.password)
    if (!result.success) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: result.error.issues[0].message })
    }
  })
type Values = z.infer<typeof schema>

const FIELDS = [
  'firstName',
  'lastName',
  'companyName',
  'phoneNumber',
  'email',
  'isGstBilling',
  'password',
] as const

const EMPTY: Values = {
  firstName: '',
  lastName: '',
  companyName: '',
  phoneNumber: '',
  email: '',
  isGstBilling: false,
  passwordMode: 'generate',
  password: '',
}

const PASSWORD_MODES = [
  {
    value: 'generate',
    label: 'Generate automatically',
    hint: 'A 12-character password is emailed.',
  },
  { value: 'set', label: 'Set password', hint: 'You choose it; it is emailed too.' },
] as const

export function AddCustomerDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const create = useCreateCustomer()
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: EMPTY })
  const passwordMode = useWatch({ control: form.control, name: 'passwordMode' })
  // Server-side failure that isn't about one field (e.g. the welcome email bounced).
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    if (open) form.reset(EMPTY)
  }, [open, form])

  const close = () => {
    setBanner(null)
    onOpenChange(false)
  }

  const onSubmit = async (v: Values) => {
    setBanner(null)
    const input: CreateCustomerInput = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      companyName: v.companyName.trim(),
      phoneNumber: compactPhone(v.phoneNumber),
      email: v.email.trim().toLowerCase(),
      isGstBilling: v.isGstBilling,
    }
    // Leave the key out entirely for a generated password.
    if (v.passwordMode === 'set') input.password = v.password

    try {
      const customer = await create.mutateAsync(input)
      toast.success(`Customer created. Sign-in details sent to ${customer.email}.`)
      close()
      navigate(`/admin/customers/${customer.id}`)
    } catch (error) {
      if (applyFieldErrors(form, error, FIELDS)) return
      if (error instanceof ApiRequestError && error.status === 409) {
        form.setError('email', { message: error.message })
        return
      }
      // 502 and anything else: keep what was typed so they can retry.
      setBanner(getApiErrorMessage(error, 'Could not create the customer.'))
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    // Don't let a stray click close it while the email is being sent.
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && close()}>
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add customer</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email with their sign-in details and can log in straight away.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {banner && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{banner}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>First name</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" {...field} />
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
                      <Input autoComplete="off" {...field} />
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
                      <Input autoComplete="off" {...field} />
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
                      <Input
                        inputMode="tel"
                        placeholder="+919876543210"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="rounded-[10px] border border-border">
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

            <FormField
              control={form.control}
              name="passwordMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
                    {PASSWORD_MODES.map((m) => {
                      const checked = field.value === m.value
                      return (
                        <label
                          key={m.value}
                          className={cn(
                            'flex cursor-pointer items-start gap-2.5 rounded-[10px] border p-3 transition-colors',
                            checked
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-[#b9c9da]',
                          )}
                        >
                          <input
                            type="radio"
                            name={field.name}
                            value={m.value}
                            checked={checked}
                            onChange={() => {
                              field.onChange(m.value)
                              form.clearErrors('password')
                            }}
                            className="mt-0.5 accent-primary"
                          />
                          <span>
                            <span className="block text-sm font-medium">{m.label}</span>
                            <span className="block text-xs text-muted-foreground">{m.hint}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </FormItem>
              )}
            />
            {passwordMode === 'set' && (
              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel required className="sr-only">
                      New password
                    </FormLabel>
                    <PasswordField
                      id="new-customer-password"
                      value={field.value}
                      onChange={field.onChange}
                      invalid={!!fieldState.error}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                disabled={submitting}
                onClick={close}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                {submitting ? 'Creating & emailing…' : 'Create customer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
