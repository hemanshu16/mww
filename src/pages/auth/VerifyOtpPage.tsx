import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthLayout } from '@/components/AuthLayout'
import { OtpInput } from '@/components/OtpInput'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { resendOtp, verifyEmail } from '@/lib/authApi'
import { getApiErrorMessage } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

const RESEND_COOLDOWN_SECONDS = 60

function VerifyOtpPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const email = (location.state as { email?: string } | null)?.email

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  if (!email) {
    return <Navigate to="/register" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setError('')

    if (code.length !== 6) {
      setError('Enter the 6-digit code sent to your email.')
      return
    }

    setSubmitting(true)
    try {
      const res = await verifyEmail({ email: email!, code })
      setSession(res.data)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'That code is not valid. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setFormError('')
    setResendMessage('')
    setResending(true)
    try {
      await resendOtp({ email: email! })
      setResendMessage('A new verification code has been sent.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Unable to resend the code right now.'))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        <>
          We sent a 6-digit code to <strong className="text-foreground">{email}</strong>.
        </>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        {resendMessage && (
          <Alert variant="success">
            <AlertDescription>{resendMessage}</AlertDescription>
          </Alert>
        )}
        <OtpInput value={code} onChange={setCode} error={error} disabled={submitting} />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          Verify email
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Didn&apos;t get the code?{' '}
        {cooldown > 0 ? (
          <span>Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            className="cursor-pointer font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </p>
    </AuthLayout>
  )
}

export default VerifyOtpPage
