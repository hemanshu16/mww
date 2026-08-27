import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-6xl text-primary">404</h1>
      <p className="text-muted-foreground">We couldn&apos;t find that page.</p>
      <Link to="/" className="mt-3 font-semibold text-primary hover:underline">
        Back to home
      </Link>
    </section>
  )
}

export default NotFoundPage
