import type { AuditEntityType } from '@/admin/types'

export const ENTITY_LABELS: Record<AuditEntityType, string> = {
  CUSTOMER: 'Customer',
  BOOKING: 'Booking',
  STAFF: 'Staff',
  ROLE: 'Role',
  COMPANY_PROFILE: 'Company profile',
  BANK_ACCOUNT: 'Bank account',
  COURIER_PROVIDER: 'Courier provider',
  COUNTRY: 'Country',
}

/** Where each record lives, and the permission needed to open it. */
export const ENTITY_PAGES: Record<AuditEntityType, { perm: string; href: (id: string) => string }> =
  {
    CUSTOMER: { perm: 'customer.read', href: (id) => `/admin/customers/${id}` },
    BOOKING: { perm: 'booking.read', href: (id) => `/admin/bookings/${id}` },
    STAFF: { perm: 'staff.read', href: () => '/admin/staff' },
    ROLE: { perm: 'role.read', href: () => '/admin/roles' },
    COMPANY_PROFILE: { perm: 'company_settings.read', href: () => '/admin/company-settings' },
    BANK_ACCOUNT: { perm: 'company_settings.read', href: () => '/admin/company-settings' },
    COURIER_PROVIDER: {
      perm: 'courier_provider.read',
      href: (id) => `/admin/courier-providers/${id}`,
    },
    COUNTRY: { perm: 'country.read', href: () => '/admin/countries' },
  }

/** Every logged action, grouped as in the backend spec. */
export const AUDIT_ACTIONS: { group: string; actions: string[] }[] = [
  {
    group: 'Customers',
    actions: [
      'customer.create',
      'customer.update',
      'customer.activate',
      'customer.deactivate',
      'customer.password_reset',
      'wallet.transaction.create',
      'wallet.credit_limit.update',
    ],
  },
  {
    group: 'Bookings',
    actions: [
      'booking.update',
      'booking.parties.update',
      'booking.kyc.update',
      'booking.kyc.view',
      'booking.cancel',
      'booking.delete',
    ],
  },
  {
    group: 'Staff and roles',
    actions: [
      'staff.create',
      'staff.update',
      'staff.activate',
      'staff.deactivate',
      'staff.password_reset',
      'role.create',
      'role.update',
      'role.delete',
    ],
  },
  {
    group: 'Company settings',
    actions: [
      'company_profile.create',
      'company_profile.update',
      'bank_account.create',
      'bank_account.update',
      'bank_account.activate',
      'bank_account.deactivate',
    ],
  },
  {
    group: 'Catalog',
    actions: [
      'courier_provider.create',
      'courier_provider.update',
      'courier_provider.update_status',
      'courier_provider.margin.create',
      'courier_provider.margin.update',
      'courier_provider.margin.delete',
      'country.create',
      'country.update',
      'country.delete',
    ],
  },
]
