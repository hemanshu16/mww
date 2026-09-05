import { Link } from 'react-router-dom'

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="inline-flex items-center" aria-label="Monarch Worldwide Express home">
      <img src="/logo-lockup.png" alt="Monarch Worldwide Express" className="h-14 w-auto" />
    </Link>
  )
}
