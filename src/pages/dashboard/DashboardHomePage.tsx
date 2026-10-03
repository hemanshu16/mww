import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  FilePenLine,
  Layers3,
  PackageCheck,
  PlusCircle,
  Package,
  CircleX,
} from 'lucide-react'
import { useBookings } from '@/hooks/useBookings'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DashboardHero } from '@/components/dashboard/DashboardHero'
import { QuickAction } from '@/components/dashboard/QuickAction'
import { StatCard } from '@/components/dashboard/StatCard'
import { ShipmentChart } from '@/components/dashboard/ShipmentChart'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDate, formatINR } from '@/lib/format'
import { MOCK_SHIPMENTS_SERIES, MOCK_SPARK, MOCK_TREND } from '@/lib/mockDashboard'
import type { SparkTone } from '@/components/dashboard/Sparkline'
import type { BookingStatus } from '@/lib/types'
import type { LucideIcon } from 'lucide-react'

function Kpi({
  status,
  label,
  icon,
  spark,
  tone,
  trend,
}: {
  /** Omit for the all-bookings total. */
  status?: BookingStatus
  label: string
  icon: LucideIcon
  spark: number[]
  tone: SparkTone
  trend?: { value: string; direction: 'up' | 'down'; favorable?: boolean }
}) {
  const { data, isLoading } = useBookings({ status, page: 1, limit: 1 })
  return (
    <Link to={status ? `/dashboard/bookings?status=${status}` : '/dashboard/bookings'}>
      <StatCard
        label={label}
        value={data?.pagination.total.toLocaleString('en-IN') ?? 0}
        icon={icon}
        spark={{ data: spark, tone }}
        trend={trend ? { ...trend, caption: 'vs last month' } : undefined}
        loading={isLoading}
        interactive
      />
    </Link>
  )
}

export default function DashboardHomePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading } = useBookings({ page: 1, limit: 5 })
  const recent = data?.items ?? []

  return (
    <div className="space-y-8">
      <DashboardHero name={profile?.firstName} />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Total bookings"
          icon={Layers3}
          spark={MOCK_SPARK.booked}
          tone="blue"
          trend={MOCK_TREND.booked}
        />
        <Kpi
          status="DRAFT"
          label="Drafts"
          icon={FilePenLine}
          spark={MOCK_SPARK.draft}
          tone="blue"
          trend={MOCK_TREND.draft}
        />
        <Kpi
          status="BOOKED"
          label="Booked"
          icon={PackageCheck}
          spark={MOCK_SPARK.booked}
          tone="green"
          trend={MOCK_TREND.booked}
        />
        <Kpi
          status="CANCELLED"
          label="Cancelled"
          icon={CircleX}
          spark={MOCK_SPARK.cancelled}
          tone="red"
          trend={{ ...MOCK_TREND.cancelled, favorable: true }}
        />
      </div>

      {/* Analytics + quick actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Shipments over time</CardTitle>
              <CardDescription>Total bookings per month</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="micro-label">Last 9 months</span>
              <span className="rounded-full bg-neutral-200 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Demo data
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ShipmentChart data={MOCK_SHIPMENTS_SERIES} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump back into your workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickAction
              primary
              to="/dashboard/bookings/new"
              icon={PlusCircle}
              label="Create a new booking"
            />
            <QuickAction
              to="/dashboard/bookings?status=DRAFT"
              icon={FilePenLine}
              label="Continue a draft"
            />
            <QuickAction to="/dashboard/bookings" icon={Package} label="View all bookings" />
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings */}
      <Card>
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Recent bookings</h2>
            <p className="text-[13px] text-subtle">Your five latest shipments</p>
          </div>
          <Link
            to="/dashboard/bookings"
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="divide-y divide-border-subtle border-t border-border-subtle">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="ml-auto h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="border-t border-border-subtle">
            <EmptyState
              icon={PackageCheck}
              title="No bookings yet"
              description="Create your first shipment to start tracking your deliveries."
              action={
                <Button asChild>
                  <Link to="/dashboard/bookings/new">New booking</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-t border-border-subtle hover:bg-transparent">
                <TableHead className="pl-6">Booking no.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((b) => {
                const amount = b.price ?? b.totalPrice
                const to = b.consignee
                  ? [b.consignee.city, b.consignee.country].filter(Boolean).join(', ')
                  : ''
                return (
                  <TableRow
                    key={b.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/dashboard/bookings/${b.id}`)}
                  >
                    <TableCell className="pl-6">
                      <Link
                        to={`/dashboard/bookings/${b.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-foreground hover:text-blue-700"
                      >
                        {b.bookingNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(b.createdAt)}
                    </TableCell>
                    <TableCell className="text-foreground">{b.shipper?.city || '—'}</TableCell>
                    <TableCell className="text-foreground">{to || '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={b.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-6 text-right font-semibold tabular-nums text-foreground">
                      {amount != null ? formatINR(amount) : '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
