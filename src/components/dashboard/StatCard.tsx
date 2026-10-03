import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkline, type SparkTone } from '@/components/dashboard/Sparkline'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: string
    direction: 'up' | 'down'
    /** Whether this movement is good news (default: up = good). Drives the colour. */
    favorable?: boolean
    caption?: string
  }
  spark?: { data: number[]; tone?: SparkTone }
  loading?: boolean
  onClick?: () => void
  interactive?: boolean
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  spark,
  loading,
  onClick,
  interactive,
}: StatCardProps) {
  const favorable = trend ? (trend.favorable ?? trend.direction === 'up') : true
  return (
    <Card
      onClick={onClick}
      className={cn(
        'transition-shadow duration-200',
        (onClick || interactive) && 'cursor-pointer hover:shadow-card-hover',
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex size-10 items-center justify-center rounded-[12px] bg-blue-50 text-blue-600">
            <Icon className="size-5" />
          </div>
          {spark && !loading && <Sparkline data={spark.data} tone={spark.tone} />}
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
          <div className="mt-3 flex items-center gap-2 text-[13px]">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-semibold',
                favorable ? 'text-success-ink' : 'text-danger-ink',
              )}
            >
              {trend.direction === 'up' ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {trend.value}
            </span>
            {trend.caption && <span className="micro-label">{trend.caption}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
