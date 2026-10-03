import type {
  Booking,
  BookingStatus,
  Pagination,
  ShipmentType,
  ShipperInput,
  WalletSummary,
  WalletTransaction,
} from '@/lib/types'

// ---------------------------------------------------------------------------
// Staff auth
// ---------------------------------------------------------------------------
export interface RoleRef {
  id: string
  name: string
}

export interface StaffProfile {
  id: string
  name: string
  email: string
  isSuperAdmin: boolean
  isActive: boolean
  roles: RoleRef[]
  createdAt: string
  updatedAt: string
}

/** Login and refresh both return this shape. */
export interface StaffAuth {
  accessToken: string
  refreshToken: string
  profile: StaffProfile
  permissions: string[]
}

export interface StaffMe {
  profile: StaffProfile
  permissions: string[]
}

// ---------------------------------------------------------------------------
// Permissions & roles
// ---------------------------------------------------------------------------
export interface PermissionDef {
  id: string
  key: string
  name: string
  description: string
}

export interface PermissionGroup {
  group: string
  permissions: PermissionDef[]
}

export interface RolePermission {
  id: string
  key: string
  name: string
  group: string
}

export interface Role {
  id: string
  name: string
  description: string | null
  permissions: RolePermission[]
  staffCount: number
  createdAt: string
  updatedAt: string
}

export interface RoleInput {
  name: string
  description?: string | null
  permissionIds?: string[]
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------
export type Staff = StaffProfile

export interface StaffDetail extends Staff {
  permissions: string[]
}

export interface StaffList {
  items: Staff[]
  pagination: Pagination
}

export interface CreateStaffInput {
  name: string
  email: string
  password: string
  roleIds?: string[]
}

export interface UpdateStaffInput {
  name?: string
  roleIds?: string[]
  isActive?: boolean
}

// ---------------------------------------------------------------------------
// Customer wallet (admin view)
// ---------------------------------------------------------------------------
export interface WalletCustomer {
  id: string
  firstName: string
  lastName: string
  companyName: string
  email: string
}

export interface AdminWalletSummary {
  user: WalletCustomer
  balance: number
  creditLimit: number
  availableBalance: number
  outstandingAmount: number
}

export interface AdminWalletTransactionList {
  items: WalletTransaction[]
  pagination: Pagination
}

export interface AddWalletTransactionInput {
  type: 'CREDIT' | 'DEBIT'
  amount: number
  paymentMode: string
  referenceNo?: string
  transactionDate: string
  note?: string
}

// ---------------------------------------------------------------------------
// Courier providers
// ---------------------------------------------------------------------------
export type ProviderStatus = 'ACTIVE' | 'INACTIVE'

export interface AdminCourierProvider {
  id: string
  name: string
  logoUrl: string | null
  isGstApplicable: boolean
  status: ProviderStatus
  createdAt: string
  updatedAt: string
}

export interface CourierProviderInput {
  name: string
  logoUrl: string
  isGstApplicable: boolean
}

/** Our margin on top of the provider's price for a whole-kg weight range. */
export interface MarginSlab {
  id: string
  /** Inclusive. */
  minKg: number
  /** Inclusive; null = "minKg and above". */
  maxKg: number | null
  /** Flat INR per shipment. */
  margin: number
  createdAt: string
  updatedAt: string
}

export interface AdminCourierProviderDetail extends AdminCourierProvider {
  /** Lightest first. */
  marginSlabs: MarginSlab[]
}

export interface MarginSlabInput {
  minKg: number
  maxKg: number | null
  margin: number
}

// ---------------------------------------------------------------------------
// Company settings
// ---------------------------------------------------------------------------
export interface CompanyProfile {
  legalName: string
  gstNumber: string | null
  updatedAt: string
}

export interface CompanyProfileInput {
  legalName: string
  /** Always sent; null clears it. */
  gstNumber: string | null
}

export interface BankAccount {
  id: string
  bankName: string
  accountName: string
  /** A string, so leading zeros survive. */
  accountNumber: string
  ifscCode: string
  branchName: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BankAccountInput {
  bankName: string
  accountName: string
  accountNumber: string
  ifscCode: string
  branchName?: string | null
  isActive?: boolean
}

export interface CompanySettings {
  /** Null until the profile is saved the first time. */
  profile: CompanyProfile | null
  /** Active first, then oldest first. */
  bankAccounts: BankAccount[]
}

// ---------------------------------------------------------------------------
// Lookups (any signed-in staff)
// ---------------------------------------------------------------------------
export interface LookupProvider {
  id: string
  name: string
  status: ProviderStatus
}

export interface LookupCountry {
  alpha2: string
  name: string
  isVisible: boolean
}

export interface LookupStaff {
  id: string
  name: string
  isActive: boolean
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export interface Customer {
  id: string
  firstName: string
  lastName: string
  companyName: string
  phoneNumber: string
  email: string
  isGstBilling: boolean
  isEmailVerified: boolean
  isActive: boolean
  wallet: WalletSummary
  bookings: { DRAFT: number; BOOKED: number; CANCELLED: number; total: number }
  createdAt: string
  updatedAt: string
}

export interface CustomerList {
  items: Customer[]
  pagination: Pagination
}

export interface CreateCustomerInput {
  firstName: string
  lastName: string
  companyName: string
  phoneNumber: string
  email: string
  isGstBilling: boolean
  /** Omit to have the server generate one. */
  password?: string
}

export type UpdateCustomerInput = Partial<{
  firstName: string
  lastName: string
  companyName: string
  phoneNumber: string
  email: string
  isGstBilling: boolean
  isEmailVerified: boolean
}>

// ---------------------------------------------------------------------------
// Bookings (admin view)
// ---------------------------------------------------------------------------
export interface BookingCustomerRef {
  id: string
  name: string
  companyName: string
  email: string
}

export interface AdminBookingRow {
  id: string
  bookingNumber: string
  status: BookingStatus
  customer: BookingCustomerRef
  courierProvider: { id: string; name: string }
  shipmentType: ShipmentType
  shipmentDate: string
  price: number | null
  referenceNumber: string | null
  /** Null until the customer fills in the parties. */
  shipperName: string | null
  consigneeName: string | null
  destination: { code: string; name: string } | null
  boxCount: number
  totalChargeableWeight: number
  createdAt: string
  updatedAt: string
}

export interface AdminBookingList {
  items: AdminBookingRow[]
  pagination: Pagination
}

export interface AdminBookingDetail extends Booking {
  customer: BookingCustomerRef
  courierProvider: { id: string; name: string }
  /** Debits minus refunds for this booking; 0 after a cancel. */
  netCharged: number
  /** Oldest first. */
  walletTransactions: WalletTransaction[]
}

/** PATCH /admin/bookings/:id/kyc. Send only what changes; `null` clears. */
export type AdminKycInput = Partial<
  Pick<
    ShipperInput,
    | 'kyc1Type'
    | 'kyc1Number'
    | 'kyc1DocFront'
    | 'kyc1DocBack'
    | 'kyc2Type'
    | 'kyc2Number'
    | 'kyc2Doc'
  >
>

/** Optimistic-concurrency token: the `updatedAt` the edit was based on. */
export interface Concurrency {
  expectedUpdatedAt?: string
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------
export const AUDIT_ENTITY_TYPES = [
  'CUSTOMER',
  'BOOKING',
  'STAFF',
  'ROLE',
  'COMPANY_PROFILE',
  'BANK_ACCOUNT',
  'COURIER_PROVIDER',
  'COUNTRY',
] as const
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number]

export interface ActivityLogEntry {
  id: string
  action: string
  entityType: AuditEntityType
  entityId: string
  /** Ready to display. */
  summary: string
  /** Only the fields that changed; dotted keys for nested fields. */
  changes: Record<string, { from: unknown; to: unknown }> | null
  actor: { id: string; name: string } | null
  createdAt: string
}

export interface ActivityLogList {
  items: ActivityLogEntry[]
  pagination: Pagination
}
