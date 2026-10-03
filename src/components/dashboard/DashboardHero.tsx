import { Link } from 'react-router-dom'
import { ArrowRight, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RouteArt } from '@/components/dashboard/RouteArt'

export function DashboardHero({ name }: { name?: string }) {
  return (
    <section className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="dotted-grid pointer-events-none absolute -inset-x-4 -inset-y-3 hidden sm:block"
        aria-hidden
      />
      <div className="relative min-w-0">
        <p className="micro-label">Welcome back</p>
        <h1 className="mt-2 text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-foreground">
          Good day{name ? `, ${name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your shipments today.
        </p>
      </div>
      <div className="relative flex items-center gap-8">
        <RouteArt className="hidden lg:block" />
        <Button asChild variant="deep" size="lg" className="shrink-0">
          <Link to="/dashboard/bookings/new">
            <PlusCircle className="size-5" />
            New booking
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
