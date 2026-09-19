import { createBrowserRouter } from 'react-router-dom'
import App from '@/App'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import DashboardHomePage from '@/pages/dashboard/DashboardHomePage'
import BookingsListPage from '@/pages/dashboard/BookingsListPage'
import BookingWizardPage from '@/pages/dashboard/BookingWizardPage'
import BookingDetailPage from '@/pages/dashboard/BookingDetailPage'
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
      { path: 'verify-email', element: <VerifyEmailPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardHomePage /> },
              { path: 'bookings', element: <BookingsListPage /> },
              { path: 'bookings/new', element: <BookingWizardPage /> },
              { path: 'bookings/:id', element: <BookingDetailPage /> },
              { path: 'bookings/:id/edit', element: <BookingWizardPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
