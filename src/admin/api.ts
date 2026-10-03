import { apiClient } from '@/lib/api/client'
import type {
  BookingStatus,
  KycDownloadUrl,
  KycUploadUrl,
  PartiesInput,
  ShipmentType,
  UpdateBookingInput,
  WalletSummary,
  WalletTransaction,
  WalletTxnType,
} from '@/lib/types'
import type {
  ActivityLogList,
  AddWalletTransactionInput,
  AdminBookingDetail,
  AdminBookingList,
  AdminKycInput,
  AuditEntityType,
  Concurrency,
  Customer,
  CustomerList,
  LookupCountry,
  LookupProvider,
  LookupStaff,
  UpdateCustomerInput,
  AdminCourierProvider,
  AdminWalletSummary,
  AdminWalletTransactionList,
  BankAccount,
  BankAccountInput,
  CompanyProfile,
  CompanyProfileInput,
  CompanySettings,
  CourierProviderInput,
  CreateStaffInput,
  PermissionGroup,
  ProviderStatus,
  Role,
  RoleInput,
  StaffAuth,
  StaffDetail,
  StaffList,
  StaffMe,
  UpdateStaffInput,
} from '@/admin/types'

function qs(params: Record<string, string | number | boolean | undefined>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

// --- auth -------------------------------------------------------------------

export function staffLogin(email: string, password: string) {
  return apiClient.post<StaffAuth>('/admin/auth/login', { email, password }, { auth: false })
}

export function staffLogout(refreshToken: string) {
  return apiClient.post<Record<string, never>>(
    '/admin/auth/logout',
    { refreshToken },
    { auth: false },
  )
}

export function getStaffMe() {
  return apiClient.get<StaffMe>('/admin/auth/me')
}

// --- permissions & roles ----------------------------------------------------

export function listPermissions() {
  return apiClient.get<PermissionGroup[]>('/admin/permissions')
}

export function listRoles() {
  return apiClient.get<Role[]>('/admin/roles')
}

export function createRole(input: RoleInput) {
  return apiClient.post<Role>('/admin/roles', input)
}

/** `permissionIds` replaces the role's whole permission list. */
export function updateRole(id: string, input: Partial<RoleInput>) {
  return apiClient.patch<Role>(`/admin/roles/${id}`, input)
}

export function deleteRole(id: string) {
  return apiClient.delete<Record<string, never>>(`/admin/roles/${id}`)
}

// --- staff ------------------------------------------------------------------

export interface ListStaffParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export function listStaff(params: ListStaffParams = {}) {
  return apiClient.get<StaffList>(`/admin/staff${qs({ ...params })}`)
}

export function getStaff(id: string) {
  return apiClient.get<StaffDetail>(`/admin/staff/${id}`)
}

export function createStaff(input: CreateStaffInput) {
  return apiClient.post<StaffDetail>('/admin/staff', input)
}

/** `roleIds` replaces the whole role list. */
export function updateStaff(id: string, input: UpdateStaffInput) {
  return apiClient.patch<StaffDetail>(`/admin/staff/${id}`, input)
}

export function resetStaffPassword(id: string, password: string) {
  return apiClient.post<Record<string, never>>(`/admin/staff/${id}/reset-password`, { password })
}

// --- customer wallet --------------------------------------------------------

export interface ListAdminWalletTxnParams {
  page?: number
  limit?: number
  type?: WalletTxnType
  from?: string
  /** YYYY-MM-DD (inclusive — sent as end of that day). */
  to?: string
}

export function getCustomerWallet(userId: string) {
  return apiClient.get<AdminWalletSummary>(`/admin/users/${userId}/wallet`)
}

export function listCustomerWalletTransactions(userId: string, params: ListAdminWalletTxnParams) {
  const { to, ...rest } = params
  return apiClient.get<AdminWalletTransactionList>(
    `/admin/users/${userId}/wallet/transactions${qs({ ...rest, to: to ? `${to}T23:59:59.999Z` : undefined })}`,
  )
}

export function addWalletTransaction(userId: string, input: AddWalletTransactionInput) {
  return apiClient.post<WalletTransaction>(`/admin/users/${userId}/wallet/transactions`, input)
}

export function updateCreditLimit(userId: string, creditLimit: number) {
  return apiClient.patch<WalletSummary>(`/admin/users/${userId}/wallet/credit-limit`, {
    creditLimit,
  })
}

// --- courier providers ------------------------------------------------------

export function listAdminCourierProviders() {
  return apiClient.get<AdminCourierProvider[]>('/admin/courier-providers')
}

export function createCourierProvider(input: CourierProviderInput) {
  return apiClient.post<AdminCourierProvider>('/admin/courier-providers', input)
}

export function updateCourierProvider(id: string, input: Partial<CourierProviderInput>) {
  return apiClient.patch<AdminCourierProvider>(`/admin/courier-providers/${id}`, input)
}

export function setCourierProviderStatus(id: string, status: ProviderStatus) {
  return apiClient.patch<AdminCourierProvider>(`/admin/courier-providers/${id}/status`, { status })
}

// --- company settings -------------------------------------------------------

export function getCompanySettings() {
  return apiClient.get<CompanySettings>('/admin/company')
}

/** Creates the profile the first time, replaces it after that. */
export function saveCompanyProfile(input: CompanyProfileInput) {
  return apiClient.put<CompanyProfile>('/admin/company/profile', input)
}

export function createBankAccount(input: BankAccountInput) {
  return apiClient.post<BankAccount>('/admin/company/bank-accounts', input)
}

/** Any subset of fields; `branchName: null` clears the branch. */
export function updateBankAccount(id: string, input: Partial<BankAccountInput>) {
  return apiClient.patch<BankAccount>(`/admin/company/bank-accounts/${id}`, input)
}

// --- lookups (any signed-in staff) ------------------------------------------

export function lookupCourierProviders() {
  return apiClient.get<LookupProvider[]>('/admin/lookups/courier-providers')
}

export function lookupCountries() {
  return apiClient.get<LookupCountry[]>('/admin/lookups/countries')
}

export function lookupStaff() {
  return apiClient.get<LookupStaff[]>('/admin/lookups/staff')
}

// --- customers --------------------------------------------------------------

export interface ListCustomersParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  isEmailVerified?: boolean
  isGstBilling?: boolean
  hasOutstanding?: boolean
  joinedFrom?: string
  joinedTo?: string
  sortBy?: 'createdAt' | 'name' | 'balance'
  sortOrder?: 'asc' | 'desc'
}

export function listCustomers(params: ListCustomersParams = {}) {
  return apiClient.get<CustomerList>(`/admin/customers${qs({ ...params })}`)
}

export function getCustomer(id: string) {
  return apiClient.get<Customer>(`/admin/customers/${id}`)
}

export function updateCustomer(id: string, input: UpdateCustomerInput) {
  return apiClient.patch<Customer>(`/admin/customers/${id}`, input)
}

export function setCustomerStatus(id: string, isActive: boolean) {
  return apiClient.patch<Customer>(`/admin/customers/${id}/status`, { isActive })
}

export function resetCustomerPassword(id: string, password: string) {
  return apiClient.post<Record<string, never>>(`/admin/customers/${id}/reset-password`, {
    password,
  })
}

// --- bookings ---------------------------------------------------------------

export interface ListAdminBookingsParams {
  page?: number
  limit?: number
  search?: string
  status?: BookingStatus
  courierProviderId?: string
  shipmentType?: ShipmentType
  customerId?: string
  destinationCountry?: string
  shipmentDateFrom?: string
  shipmentDateTo?: string
  createdFrom?: string
  createdTo?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'createdAt' | 'shipmentDate' | 'price'
  sortOrder?: 'asc' | 'desc'
}

export function listAdminBookings(params: ListAdminBookingsParams = {}) {
  return apiClient.get<AdminBookingList>(`/admin/bookings${qs({ ...params })}`)
}

export function getAdminBooking(id: string) {
  return apiClient.get<AdminBookingDetail>(`/admin/bookings/${id}`)
}

export function updateAdminBooking(id: string, input: UpdateBookingInput & Concurrency) {
  return apiClient.patch<AdminBookingDetail>(`/admin/bookings/${id}`, input)
}

export function updateAdminBookingParties(id: string, input: PartiesInput & Concurrency) {
  return apiClient.put<AdminBookingDetail>(`/admin/bookings/${id}/parties`, input)
}

export function cancelAdminBooking(id: string, input: { reason?: string } & Concurrency) {
  return apiClient.post<AdminBookingDetail>(`/admin/bookings/${id}/cancel`, input)
}

export function deleteAdminBooking(id: string) {
  return apiClient.delete<Record<string, never>>(`/admin/bookings/${id}`)
}

// Shipper KYC. Files go to the booking customer's KYC folder.

/** Logged as `booking.kyc.view`; the URL expires, so ask on each view. */
export function requestAdminKycDownloadUrl(id: string, path: string) {
  return apiClient.post<KycDownloadUrl>(`/admin/bookings/${id}/kyc/download-url`, { path })
}

export function requestAdminKycUploadUrl(id: string, fileName: string, contentType?: string) {
  return apiClient.post<KycUploadUrl>(`/admin/bookings/${id}/kyc/upload-url`, {
    fileName,
    contentType,
  })
}

/** Only the fields sent change; `null` clears one. */
export function updateAdminBookingKyc(id: string, input: AdminKycInput & Concurrency) {
  return apiClient.patch<AdminBookingDetail>(`/admin/bookings/${id}/kyc`, input)
}

// --- activity log -----------------------------------------------------------

export interface ListActivityParams {
  page?: number
  limit?: number
  entityType?: AuditEntityType
  entityId?: string
  actorId?: string
  action?: string
  from?: string
  to?: string
}

export function listActivityLogs(params: ListActivityParams = {}) {
  return apiClient.get<ActivityLogList>(`/admin/activity-logs${qs({ ...params })}`)
}
