import { useState } from 'react'
import { Check, Copy, Eye, EyeOff, Wand2 } from 'lucide-react'
import { generatePassword } from '@/admin/forms'
import { passwordChecks } from '@/lib/validation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** Password input with show/hide, generate and copy, plus the rule checklist. */
export function PasswordField({
  value,
  onChange,
  id,
  invalid,
}: {
  value: string
  onChange: (value: string) => void
  id?: string
  invalid?: boolean
}) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            type={visible ? 'text' : 'password'}
            autoComplete="new-password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={invalid}
            className="pr-10 font-mono"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[#8291a8] hover:bg-[#eef2f8] hover:text-foreground"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onChange(generatePassword())
            setVisible(true)
          }}
        >
          <Wand2 className="size-4" /> Generate
        </Button>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={copy}
            aria-label="Copy password"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {passwordChecks.map((c) => (
          <li
            key={c.label}
            className={cn(
              'flex items-center gap-1.5 text-xs',
              c.test(value) ? 'text-[#047857]' : 'text-muted-foreground',
            )}
          >
            <Check className={cn('size-3.5', !c.test(value) && 'opacity-30')} />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
