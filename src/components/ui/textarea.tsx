import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-20 w-full rounded-2xl border-[1.5px] border-input bg-card px-5 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground hover:border-neutral-500 focus-visible:border-ring focus-visible:ring-[4px] focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/15 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
