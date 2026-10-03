import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { StaffAuthProvider } from '@/admin/StaffAuthProvider'
import { AdminLayout } from '@/admin/components/AdminLayout'
import { AdminHome, RequirePermission, RequireStaff } from '@/admin/components/guards'
import AdminLoginPage from '@/admin/pages/AdminLoginPage'
import CustomersPage from '@/admin/pages/CustomersPage'
import CustomerDetailPage from '@/admin/pages/CustomerDetailPage'
import AdminBookingsPage from '@/admin/pages/AdminBookingsPage'
import AdminBookingDetailPage from '@/admin/pages/AdminBookingDetailPage'
import AdminBookingEditPage from '@/admin/pages/AdminBookingEditPage'
import ActivityLogPage from '@/admin/pages/ActivityLogPage'
import CourierProvidersPage from '@/admin/pages/CourierProvidersPage'
import CourierProviderDetailPage from '@/admin/pages/CourierProviderDetailPage'
import CountriesPage from '@/admin/pages/CountriesPage'
import StaffPage from '@/admin/pages/StaffPage'
import RolesPage from '@/admin/pages/RolesPage'
import CompanySettingsPage from '@/admin/pages/CompanySettingsPage'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'

function AdminNotFound() {
  return (
    <Card>
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="This admin page doesn't exist."
      />
    </Card>
  )
}

/** Old "Customer wallets" links now open the customer's Wallet tab. */
function WalletRedirect() {
  const { userId } = useParams<{ userId: string }>()
  return (
    <Navigate to={userId ? `/admin/customers/${userId}?tab=wallet` : '/admin/customers'} replace />
  )
}

const guard = (perm: string, page: React.ReactNode) => (
  <RequirePermission perm={perm}>{page}</RequirePermission>
)

/** Everything under /admin. Loaded lazily, so customers never download it. */
export default function AdminApp() {
  return (
    <StaffAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<RequireStaff />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="customers" element={guard('customer.read', <CustomersPage />)} />
            <Route path="customers/:id" element={guard('customer.read', <CustomerDetailPage />)} />
            <Route path="bookings" element={guard('booking.read', <AdminBookingsPage />)} />
            <Route
              path="bookings/:id"
              element={guard('booking.read', <AdminBookingDetailPage />)}
            />
            <Route
              path="bookings/:id/edit"
              element={guard('booking.update', <AdminBookingEditPage />)}
            />
            <Route path="activity-log" element={guard('audit_log.read', <ActivityLogPage />)} />
            <Route
              path="courier-providers"
              element={guard('courier_provider.read', <CourierProvidersPage />)}
            />
            <Route
              path="courier-providers/:id"
              element={guard('courier_provider.read', <CourierProviderDetailPage />)}
            />
            <Route path="countries" element={guard('country.read', <CountriesPage />)} />
            <Route path="staff" element={guard('staff.read', <StaffPage />)} />
            <Route path="roles" element={guard('role.read', <RolesPage />)} />
            <Route
              path="company-settings"
              element={guard('company_settings.read', <CompanySettingsPage />)}
            />
            <Route path="wallets" element={<WalletRedirect />} />
            <Route path="wallets/:userId" element={<WalletRedirect />} />
            <Route path="*" element={<AdminNotFound />} />
          </Route>
        </Route>
      </Routes>
    </StaffAuthProvider>
  )
}
