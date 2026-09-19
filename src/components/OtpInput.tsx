import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  autoFocus?: boolean
  onComplete?: (value: string) => void
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  autoFocus,
  onComplete,
}: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  const emit = (next: string) => {
    onChange(next)
    if (next.length === length) onComplete?.(next)
  }

  const setAt = (index: number, digit: string) => {
    const arr = value.split('')
    arr[index] = digit
    emit(arr.join('').slice(0, length))
  }

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '')
    if (!clean) {
      setAt(index, '')
      return
    }
    // Support pasting a full code into any box.
    if (clean.length > 1) {
      emit((value.slice(0, index) + clean).slice(0, length))
      const nextFocus = Math.min(index + clean.length, length - 1)
      inputs.current[nextFocus]?.focus()
      return
    }
    setAt(index, clean)
    if (index < length - 1) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < length - 1) inputs.current[index + 1]?.focus()
  }

  return (
    <div className="flex gap-2 sm:gap-3" role="group" aria-label="Verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={i === 0 ? length : 1}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-12 w-11 rounded-lg border border-input bg-card text-center text-lg font-semibold shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 sm:h-14 sm:w-12',
          )}
        />
      ))}
    </div>
  )
}
