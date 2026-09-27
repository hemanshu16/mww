import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { ADMIN_NAV } from '@/admin/nav'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'

/** Only a staff session gets past; anything else goes to the staff login. */
export function RequireStaff() {
  const { status } = useStaffAuth()
  const location = useLocation()
  if (status !== 'authenticated') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export function NoAccess({
  title = 'No access',
  description,
}: {
  title?: string
  description?: string
}) {
  return (
    <Card>
      <EmptyState
        icon={ShieldAlert}
        title={title}
        description={
          description ??
          "You don't have access to this page. Contact an administrator if you need it."
        }
      />
    </Card>
  )
}

/** Guards a page with its read permission. */
export function RequirePermission({ perm, children }: { perm: string; children: React.ReactNode }) {
  const { can } = useStaffAuth()
  return can(perm) ? <>{children}</> : <NoAccess />
}

/** `/admin`: send staff to the first section they can open. */
export function AdminHome() {
  const { can } = useStaffAuth()
  const first = ADMIN_NAV.find((item) => can(item.perm))
  if (first) return <Navigate to={first.to} replace />
  return (
    <NoAccess
      title="Your account has no access yet"
      description="Contact an administrator to be given a role."
    />
  )
}
