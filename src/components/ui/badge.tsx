import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-muted-foreground',
        draft: 'border-transparent bg-neutral-200 text-neutral-700',
        booked: 'border-transparent bg-success-soft text-success-ink',
        delivered: 'border-transparent bg-success-soft text-success-ink',
        success: 'border-transparent bg-success-soft text-success-ink',
        transit: 'border-transparent bg-blue-100 text-blue-700',
        info: 'border-transparent bg-blue-100 text-blue-700',
        pending: 'border-transparent bg-warning-soft text-warning-ink',
        gold: 'border-transparent bg-warning-soft text-warning-ink',
        cancelled: 'border-transparent bg-danger-soft text-danger-ink',
        destructive: 'border-transparent bg-danger-soft text-danger-ink',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
