import { createBrowserRouter } from 'react-router-dom'
import App from '@/App'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import VerifyOtpPage from '@/pages/auth/VerifyOtpPage'
import DashboardHomePage from '@/pages/dashboard/DashboardHomePage'
import CourierBookingPage from '@/pages/dashboard/CourierBookingPage'
import RateImportPage from '@/pages/dashboard/RateImportPage'
import ProviderExportPage from '@/pages/dashboard/ProviderExportPage'
import RateImport2Page from '@/pages/dashboard/RateImport2Page'
import PaymentPage from '@/pages/dashboard/PaymentPage'
import LedgerPage from '@/pages/dashboard/LedgerPage'
import ProfilePage from '@/pages/dashboard/ProfilePage'
import NotFoundPage from '@/pages/NotFoundPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/DashboardLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'verify-otp', element: <VerifyOtpPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardHomePage /> },
              { path: 'courier-booking', element: <CourierBookingPage /> },
              { path: 'rate-import', element: <RateImportPage /> },
              { path: 'provider-export', element: <ProviderExportPage /> },
              { path: 'rate-import-2', element: <RateImport2Page /> },
              { path: 'payments', element: <PaymentPage /> },
              { path: 'ledger', element: <LedgerPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
