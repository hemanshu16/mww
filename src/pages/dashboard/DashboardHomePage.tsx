import { Link } from 'react-router-dom'
import { ArrowRight, FileEdit, PackageCheck, PlusCircle, XCircle } from 'lucide-react'
import { useBookings } from '@/hooks/useBookings'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/StatusBadge'
import { RouteCell } from '@/components/booking/RouteCell'
import { formatDate, formatWeight } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { BookingStatus } from '@/lib/types'

function CountCard({
  status,
  label,
  icon: Icon,
  tone,
}: {
  status: BookingStatus
  label: string
  icon: typeof FileEdit
  tone: string
}) {
  const { data, isLoading } = useBookings({ status, page: 1, limit: 1 })
  return (
    <Link to={`/dashboard/bookings?status=${status}`}>
      <Card className="transition-shadow hover:shadow-elevate-lg">
        <CardContent className="flex items-center gap-4 p-5">
          <div className={cn('flex size-11 items-center justify-center rounded-xl', tone)}>
            <Icon className="size-5" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              <div className="font-heading text-2xl leading-none">{data?.pagination.total ?? 0}</div>
            )}
            <div className="mt-1 text-sm text-muted-foreground">{label}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DashboardHomePage() {
  const { profile } = useAuth()
  const { data, isLoading } = useBookings({ page: 1, limit: 5 })
  const recent = data?.items ?? []

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl tracking-tight">
            Welcome{profile ? `, ${profile.firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s an overview of your shipments.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/bookings/new">
            <PlusCircle className="size-4" />
            New booking
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CountCard status="DRAFT" label="Drafts" icon={FileEdit} tone="bg-neutral-200 text-neutral-700" />
        <CountCard status="BOOKED" label="Booked" icon={PackageCheck} tone="bg-success/12 text-success" />
        <CountCard
          status="CANCELLED"
          label="Cancelled"
          icon={XCircle}
          tone="bg-destructive/12 text-destructive"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-heading text-lg">Recent bookings</h2>
          <Link
            to="/dashboard/bookings"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="ml-auto h-5 w-20" />
              </div>
            ))
          ) : recent.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/dashboard/bookings/new">Create your first shipment</Link>
              </Button>
            </div>
          ) : (
            recent.map((b) => (
              <Link
                key={b.id}
                to={`/dashboard/bookings/${b.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{b.bookingNumber}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
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
