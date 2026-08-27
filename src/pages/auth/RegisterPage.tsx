import { useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthLayout } from '@/components/AuthLayout'
import { FormField, PasswordField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { registerClient } from '@/lib/authApi'
import { getApiErrorMessage } from '@/lib/api'

interface FormState {
  firstName: string
  lastName: string
  companyName: string
  phoneNumber: string
  email: string
  password: string
  isGstBilling: boolean
}

const initialState: FormState = {
  firstName: '',
  lastName: '',
  companyName: '',
  phoneNumber: '',
  email: '',
  password: '',
  isGstBilling: false,
}

function RegisterPage() {
  const navigate = useNavigate()
  const gstCheckboxId = useId()
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.firstName.trim()) next.firstName = 'Enter your first name.'
    if (!form.lastName.trim()) next.lastName = 'Enter your last name.'
    if (!form.companyName.trim()) next.companyName = 'Enter your company name.'
    if (!/^\+?[1-9]\d{7,14}$/.test(form.phoneNumber.trim()))
      next.phoneNumber = 'Enter a valid phone number, e.g. +919876543210.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await registerClient({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        companyName: form.companyName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        password: form.password,
        isGstBilling: form.isGstBilling,
      })
      navigate('/verify-otp', { state: { email: res.data.email } })
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Unable to register. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your client account"
      subtitle="Tell us about you and your company to get started."
      width="wide"
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="First name"
            autoComplete="given-name"
            required
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            error={errors.firstName}
          />
          <FormField
            label="Last name"
            autoComplete="family-name"
            required
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
            error={errors.lastName}
          />
        </div>
        <FormField
          label="Company name"
          autoComplete="organization"
          required
          value={form.companyName}
          onChange={(e) => update('companyName', e.target.value)}
          error={errors.companyName}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+919876543210"
            required
            value={form.phoneNumber}
            onChange={(e) => update('phoneNumber', e.target.value)}
            error={errors.phoneNumber}
          />
          <FormField
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            error={errors.email}
          />
        </div>
        <PasswordField
          label="Password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          error={errors.password}
          helperText={errors.password ? undefined : 'At least 8 characters.'}
        />
        <label htmlFor={gstCheckboxId} className="flex items-start gap-3 text-sm text-foreground">
          <Checkbox
            id={gstCheckboxId}
            checked={form.isGstBilling}
            onCheckedChange={(checked) => update('isGstBilling', checked === true)}
          />
          <span>I need GST billing for this account.</span>
        </label>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          Create account
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default RegisterPage
