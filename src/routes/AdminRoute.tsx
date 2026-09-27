import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Customers never download the admin bundle.
const AdminApp = lazy(() => import('@/admin/AdminApp'))

export function AdminRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      }
    >
      <AdminApp />
    </Suspense>
  )
}
