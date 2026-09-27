import {
  Building2,
  Contact,
  Earth,
  History,
  KeyRound,
  Package,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface AdminNavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Read permission that shows the menu item and guards the page. */
  perm: string
}

export const ADMIN_NAV: AdminNavItem[] = [
  { to: '/admin/customers', label: 'Customers', icon: Contact, perm: 'customer.read' },
  { to: '/admin/bookings', label: 'Bookings', icon: Package, perm: 'booking.read' },
  {
    to: '/admin/courier-providers',
    label: 'Courier providers',
    icon: Truck,
    perm: 'courier_provider.read',
  },
  { to: '/admin/countries', label: 'Countries', icon: Earth, perm: 'country.read' },
  { to: '/admin/staff', label: 'Staff', icon: Users, perm: 'staff.read' },
  { to: '/admin/roles', label: 'Roles', icon: KeyRound, perm: 'role.read' },
  {
    to: '/admin/company-settings',
    label: 'Company settings',
    icon: Building2,
    perm: 'company_settings.read',
  },
  { to: '/admin/activity-log', label: 'Activity log', icon: History, perm: 'audit_log.read' },
]
