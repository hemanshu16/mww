import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type StatusTone = 'accent' | 'gold' | 'neutral' | 'outline'

const TONE_CLASSES: Record<StatusTone, string> = {
  accent: 'bg-blue-100 text-blue-800',
  gold: 'bg-gold-100 text-gold-800',
  neutral: 'bg-neutral-200 text-neutral-800',
  outline: 'border-[1.5px] border-primary text-primary bg-transparent',
}

export function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: StatusTone
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold whitespace-nowrap',
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  )
}
