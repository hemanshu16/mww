import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { n: 1, label: 'Shipment & packages' },
  { n: 2, label: 'Sender & receiver' },
  { n: 3, label: 'Review & submit' },
]

export function Stepper({
  current,
  onStepClick,
  maxReachable,
}: {
  current: number
  onStepClick?: (step: number) => void
  maxReachable: number
}) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {STEPS.map((step, i) => {
        const isDone = step.n < current
        const isActive = step.n === current
        const reachable = step.n <= maxReachable
        return (
          <li key={step.n} className="flex flex-1 items-center gap-2 sm:gap-4">
            <button
              type="button"
              disabled={!reachable || !onStepClick}
              onClick={() => reachable && onStepClick?.(step.n)}
              className={cn(
                'flex items-center gap-2.5 text-left',
                reachable && onStepClick ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  isDone && 'bg-success text-success-foreground',
                  isActive && 'bg-primary text-primary-foreground',
                  !isDone && !isActive && 'bg-muted text-muted-foreground',
                )}
              >
                {isDone ? <Check className="size-4" /> : step.n}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-medium sm:block',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                className={cn('h-px flex-1', step.n < current ? 'bg-success' : 'bg-border')}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
