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
        draft: 'border-transparent bg-[#f1f5f9] text-[#475569]',
        booked: 'border-transparent bg-[#eff6ff] text-[#1d4ed8]',
        transit: 'border-transparent bg-[#fffbeb] text-[#b45309]',
        delivered: 'border-transparent bg-[#ecfdf5] text-[#047857]',
        cancelled: 'border-transparent bg-[#fef2f2] text-[#b91c1c]',
        success: 'border-transparent bg-[#ecfdf5] text-[#047857]',
        destructive: 'border-transparent bg-[#fef2f2] text-[#b91c1c]',
        gold: 'border-transparent bg-[#fffbeb] text-[#b45309]',
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
