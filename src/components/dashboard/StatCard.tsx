import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkline } from '@/components/dashboard/Sparkline'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  /** Tailwind classes for the icon chip bg + text, e.g. 'bg-[#eff6ff] text-primary'. */
  iconTone: string
  trend?: { value: string; direction: 'up' | 'down'; caption?: string }
  spark?: { data: number[]; stroke?: string }
  loading?: boolean
  onClick?: () => void
  interactive?: boolean
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconTone,
  trend,
  spark,
  loading,
  onClick,
  interactive,
}: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'transition-shadow duration-200',
        (onClick || interactive) && 'cursor-pointer hover:shadow-card-hover',
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className={cn('flex size-10 items-center justify-center rounded-[10px]', iconTone)}>
            <Icon className="size-5" />
          </div>
          {spark && !loading && <Sparkline data={spark.data} stroke={spark.stroke} />}
        </div>
        <p className="mt-4 text-[13px] font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-1.5 h-8 w-20" />
        ) : (
          <p className="mt-1 text-[28px] font-bold leading-[34px] tracking-[-0.02em] text-foreground">
            {value}
          </p>
        )}
        {trend && !loading && (
          <div className="mt-2 flex items-center gap-1.5 text-[13px]">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-semibold',
                trend.direction === 'up' ? 'text-[#047857]' : 'text-[#b91c1c]',
              )}
            >
              {trend.direction === 'up' ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {trend.value}
            </span>
            {trend.caption && <span className="text-muted-foreground">{trend.caption}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
