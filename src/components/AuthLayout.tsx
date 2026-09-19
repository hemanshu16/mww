import { Link } from 'react-router-dom'
import { Plane } from 'lucide-react'

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-blue-800 p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #75a4d3 0, transparent 40%), radial-gradient(circle at 80% 60%, #4c81b8 0, transparent 45%)',
          }}
        />
        <Link to="/" className="relative z-10 inline-flex">
          <img src="/logo-mark-white.png" alt="Monarch Worldwide Express" className="h-12 w-auto" />
        </Link>
        <div className="relative z-10 max-w-md">
          <Plane className="mb-6 size-10 text-blue-200" />
          <h2 className="font-heading text-3xl leading-tight text-white">
            Ship to the world, from India.
          </h2>
          <p className="mt-4 text-blue-100">
            Create bookings, manage KYC and invoices, and track chargeable weight — all in one
            place. The reach of a global network with a personal touch.
          </p>
        </div>
        <p className="relative z-10 text-xs text-blue-200">
          © {new Date().getFullYear()} Monarch Worldwide Express
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex lg:hidden">
            <img src="/logo-lockup.png" alt="Monarch Worldwide Express" className="h-12 w-auto" />
          </Link>
          <h1 className="font-heading text-2xl tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
