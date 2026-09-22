import { Link } from 'react-router-dom'
import { ArrowRight, Plane } from 'lucide-react'

export function SidebarPromo() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#dce8f6] bg-gradient-to-br from-[#eaf2fc] to-[#f6faff] p-4">
      {/* decorative globe + orbit */}
      <div className="absolute -right-6 -top-6 size-24 rounded-full border border-dashed border-[#bcd4ef]" aria-hidden />
      <div className="relative mb-3 flex size-10 items-center justify-center rounded-full bg-primary text-white shadow-card">
        <Plane className="size-5 -rotate-12" />
      </div>
      <p className="relative text-[15px] font-semibold leading-snug text-[#13294b]">
        Delivering possibilities worldwide
      </p>
      <p className="relative mt-1 text-[12px] leading-snug text-[#526581]">
        Air, sea and door-to-door, since 2001.
      </p>
      <Link
        to="/dashboard/bookings/new"
        aria-label="Create a new booking"
        className="relative mt-3 inline-flex size-9 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-blue-600"
      >
        <ArrowRight className="size-4" />
      </Link>
    </div>
  )
}
