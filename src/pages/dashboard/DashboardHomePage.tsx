import { Link } from 'react-router-dom'
import { ArrowRight, FileEdit, PackageCheck, PlusCircle, Layers, XCircle } from 'lucide-react'
import { useBookings } from '@/hooks/useBookings'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { StatCard } from '@/components/dashboard/StatCard'
import { ShipmentChart } from '@/components/dashboard/ShipmentChart'
import { StatusBadge } from '@/components/StatusBadge'
import { RouteCell } from '@/components/booking/RouteCell'
import { formatDate, formatWeight } from '@/lib/format'
import { MOCK_SHIPMENTS_SERIES, MOCK_SPARK, MOCK_TREND } from '@/lib/mockDashboard'
import type { BookingStatus } from '@/lib/types'
import type { LucideIcon } from 'lucide-react'

function useCount(status?: BookingStatus) {
  return useBookings({ status, page: 1, limit: 1 })
}

function KpiTotal() {
  const { data, isLoading } = useCount()
  return (
    <Link to="/dashboard/bookings">
      <StatCard
        label="Total bookings"
        value={data?.pagination.total.toLocaleString('en-IN') ?? 0}
        icon={Layers}
        iconTone="bg-[#eff6ff] text-primary"
        trend={{ ...MOCK_TREND.booked, caption: 'vs last month' }}
        spark={{ data: MOCK_SPARK.booked }}
        loading={isLoading}
        interactive
      />
    </Link>
  )
}

function Kpi({
  status,
  label,
  icon,
  iconTone,
  spark,
  trend,
}: {
  status: BookingStatus
  label: string
  icon: LucideIcon
  iconTone: string
  spark: number[]
  trend?: { value: string; direction: 'up' | 'down' }
}) {
  const { data, isLoading } = useCount(status)
  return (
    <Link to={`/dashboard/bookings?status=${status}`}>
      <StatCard
        label={label}
        value={data?.pagination.total.toLocaleString('en-IN') ?? 0}
        icon={icon}
        iconTone={iconTone}
        spark={{ data: spark }}
        trend={trend ? { ...trend, caption: 'vs last month' } : undefined}
        loading={isLoading}
        interactive
      />
    </Link>
  )
}

export default function DashboardHomePage() {
  const { profile } = useAuth()
  const { data, isLoading } = useBookings({ page: 1, limit: 5 })
  const recent = data?.items ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good day${profile ? `, ${profile.firstName}` : ''}`}
        description="Here's what's happening with your shipments today."
        actions={
          <Button asChild>
            <Link to="/dashboard/bookings/new">
              <PlusCircle className="size-4" />
              New booking
            </Link>
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTotal />
        <Kpi
          status="DRAFT"
          label="Drafts"
          icon={FileEdit}
          iconTone="bg-[#f1f5f9] text-[#475569]"
          spark={MOCK_SPARK.draft}
          trend={MOCK_TREND.draft}
        />
        <Kpi
          status="BOOKED"
          label="Booked"
          icon={PackageCheck}
          iconTone="bg-[#ecfdf5] text-[#047857]"
          spark={MOCK_SPARK.booked}
          trend={MOCK_TREND.booked}
        />
        <Kpi
          status="CANCELLED"
          label="Cancelled"
          icon={XCircle}
          iconTone="bg-[#fef2f2] text-[#b91c1c]"
          spark={MOCK_SPARK.cancelled}
          trend={MOCK_TREND.cancelled}
        />
      </div>

      {/* Analytics + quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Shipments over time</CardTitle>
              <CardDescription>Total bookings over the last 9 months</CardDescription>
            </div>
            <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              Demo data
            </span>
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
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link to="/dashboard/bookings/new">
                <PlusCircle className="size-4" /> Create a new booking
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/dashboard/bookings?status=DRAFT">
                <FileEdit className="size-4" /> Continue a draft
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/dashboard/bookings">
                <Layers className="size-4" /> View all bookings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings */}
      <Card>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Recent bookings</h2>
            <p className="text-[13px] text-muted-foreground">Your five latest shipments</p>
          </div>
          <Link
            to="/dashboard/bookings"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="divide-y divide-[#edf1f6]">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="ml-auto h-6 w-20 rounded-full" />
              </div>
            ))
          ) : recent.length === 0 ? (
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
          ) : (
            recent.map((b) => (
              <Link
                key={b.id}
                to={`/dashboard/bookings/${b.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#f8fafc]"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground">{b.bookingNumber}</div>
                  <div className="mt-0.5 text-[13px] text-muted-foreground">
                    {formatDate(b.createdAt)} · {formatWeight(b.summary.totalChargeableWeight)}
                  </div>
                </div>
                <div className="ml-auto hidden sm:block">
                  <RouteCell shipper={b.shipper} consignee={b.consignee} />
                </div>
                <StatusBadge status={b.status} />
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
