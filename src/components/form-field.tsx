import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FieldChromeProps {
  label: string
  error?: string
  helperText?: string
  required?: boolean
  id: string
}

function FieldChrome({
  label,
  error,
  helperText,
  required,
  id,
  children,
}: FieldChromeProps & { children: ReactNode }) {
  const errorId = `${id}-error`
  const helperId = `${id}-helper`
  return (
    <div className="flex flex-col gap-2 text-left">
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {error && (
        <p className="text-[13px] font-medium text-destructive" id={errorId} role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-[13px] text-muted-foreground" id={helperId}>
          {helperText}
        </p>
      )}
    </div>
  )
}

interface FormFieldProps extends ComponentProps<'input'> {
  label: string
  error?: string
  helperText?: string
}

export function FormField({
  label,
  error,
  helperText,
  id,
  required,
  className,
  ...props
}: FormFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`

  return (
    <FieldChrome
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      id={inputId}
    >
      <Input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        required={required}
        className={className}
        {...props}
      />
    </FieldChrome>
  )
}

interface FormTextareaProps extends ComponentProps<'textarea'> {
  label: string
  error?: string
  helperText?: string
}

export function FormTextarea({
  label,
  error,
  helperText,
  id,
  required,
  className,
  ...props
}: FormTextareaProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`

  return (
    <FieldChrome
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      id={inputId}
    >
      <Textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        required={required}
        className={className}
        {...props}
      />
    </FieldChrome>
  )
}

interface PasswordFieldProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: string
  error?: string
  helperText?: string
}

export function PasswordField({
  label,
  error,
  helperText,
  id,
  required,
  className,
  autoComplete,
  ...props
}: PasswordFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`
  const [visible, setVisible] = useState(false)

  return (
    <FieldChrome
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      id={inputId}
    >
      <div className="relative flex">
        <Input
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          required={required}
          autoComplete={autoComplete ?? 'current-password'}
          className={cn('pr-12', className)}
          {...props}
        />
        <button
          type="button"
          className="absolute top-1/2 right-1.5 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-primary"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
    </FieldChrome>
  )
}
