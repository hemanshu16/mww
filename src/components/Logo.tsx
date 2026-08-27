import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({ to = '/', dark = false }: { to?: string; dark?: boolean }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2.5"
      aria-label="Monarch Worldwide Express home"
    >
      <span
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-5">
          <path
            d="M4 20V6a2 2 0 0 1 2-2h6l8 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
            fill="currentColor"
          />
          <path d="M12 4v6h8" stroke="var(--card)" strokeWidth="1.6" />
        </svg>
      </span>
      <span
        className={cn(
          'font-heading text-lg tracking-tight',
          dark ? 'text-white' : 'text-foreground',
        )}
      >
        Monarch <span className="text-gold-400">Worldwide</span>
      </span>
    </Link>
  )
}
