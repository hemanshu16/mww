import { Link } from 'react-router-dom'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuickAction({
  to,
  icon: Icon,
  label,
  primary,
}: {
  to: string
  icon: LucideIcon
  label: string
  /** The lead action: deep blue instead of blue-50. */
  primary?: boolean
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex h-[52px] items-center gap-3 rounded-[12px] px-4 text-sm font-semibold transition-[transform,background-color] duration-150 hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blue-500/30',
        primary
          ? 'bg-blue-700 text-primary-foreground shadow-cta hover:bg-blue-800'
          : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="flex-1">{label}</span>
      <ArrowRight className="size-4 shrink-0 opacity-70 transition-opacity group-hover:opacity-100" />
    </Link>
  )
}
