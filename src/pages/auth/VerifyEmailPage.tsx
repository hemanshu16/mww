import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
import { OtpInput } from '@/components/OtpInput'
import { useAuth } from '@/hooks/useAuth'
import { resendOtp, verifyEmail } from '@/lib/api/auth'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'

const CODE_LENGTH = 6

/** Pull "N" out of "Please wait Ns before requesting a new code". */
function parseCooldown(message: string): number {
  const match = message.match(/(\d+)\s*s/i)
  return match ? Number(match[1]) : 30
}

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const email = params.get('email') ?? ''

  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const submittedFor = useRef<string | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const doVerify = useCallback(
    async (value: string) => {
      if (value.length !== CODE_LENGTH || submittedFor.current === value) return
      submittedFor.current = value
      setVerifying(true)
      try {
        const session = await verifyEmail(email, value)
        signIn(session)
        toast.success('Email verified. Welcome aboard!')
        navigate('/dashboard', { replace: true })
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Invalid or expired code.'))
        setCode('')
        submittedFor.current = null
      } finally {
        setVerifying(false)
      }
    },
    [email, navigate, signIn],
  )

  const handleResend = async () => {
    if (cooldown > 0) return
    setResending(true)
    try {
      await resendOtp(email)
      toast.success('A new code is on its way.')
      setCooldown(30)
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 429) {
        setCooldown(parseCooldown(error.message))
      }
      toast.error(getApiErrorMessage(error, 'Could not resend the code.'))
    } finally {
      setResending(false)
    }
  }

  if (!email) {
    return (
      <AuthLayout title="Verify your email" subtitle="We need to know which account to verify.">
        <p className="text-sm text-muted-foreground">
          This link is missing an email address.{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Go to sign in
          </Link>
          .
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${email}.`}
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-6">
        <OtpInput
          value={code}
          onChange={setCode}
          length={CODE_LENGTH}
          disabled={verifying}
          autoFocus
          onComplete={doVerify}
        />
        <Button
          className="w-full"
          loading={verifying}
          disabled={code.length !== CODE_LENGTH}
          onClick={() => doVerify(code)}
        >
          Verify email
        </Button>
        <div className="text-sm text-muted-foreground">
          Didn&apos;t get it?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}
