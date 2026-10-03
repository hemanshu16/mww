import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addWalletTransaction,
  cancelAdminBooking,
  createCustomer,
  createBankAccount,
  createCourierProvider,
  createRole,
  createStaff,
  deleteAdminBooking,
  deleteRole,
  getAdminBooking,
  getCompanySettings,
  getCustomer,
  getCustomerWallet,
  getStaff,
  listActivityLogs,
  listAdminBookings,
  listAdminCourierProviders,
  listCustomers,
  listCustomerWalletTransactions,
  listPermissions,
  listRoles,
  listStaff,
  lookupCountries,
  lookupCourierProviders,
  lookupStaff,
  resetCustomerPassword,
  resetStaffPassword,
  saveCompanyProfile,
  setCourierProviderStatus,
  setCustomerStatus,
  updateAdminBooking,
  updateAdminBookingKyc,
  updateAdminBookingParties,
  updateBankAccount,
  updateCourierProvider,
  updateCreditLimit,
  updateCustomer,
  updateRole,
  updateStaff,
  type ListActivityParams,
  type ListAdminBookingsParams,
  type ListAdminWalletTxnParams,
  type ListCustomersParams,
  type ListStaffParams,
} from '@/admin/api'
import { queryKeys } from '@/lib/queryKeys'
import type { PartiesInput, UpdateBookingInput } from '@/lib/types'
import type {
  AddWalletTransactionInput,
  AdminBookingDetail,
  AdminCourierProvider,
  AdminKycInput,
  Concurrency,
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
  BankAccountInput,
  CompanyProfileInput,
  CompanySettings,
  CourierProviderInput,
  CreateStaffInput,
  ProviderStatus,
  RoleInput,
  UpdateStaffInput,
} from '@/admin/types'

export const adminKeys = {
  all: ['admin'] as const,
  permissions: ['admin', 'permissions'] as const,
  roles: ['admin', 'roles'] as const,
  staffRoot: ['admin', 'staff'] as const,
  staffList: (params: ListStaffParams) => ['admin', 'staff', 'list', params] as const,
  staff: (id: string) => ['admin', 'staff', 'detail', id] as const,
  wallet: (userId: string) => ['admin', 'wallet', userId] as const,
  walletTxns: (userId: string, params: ListAdminWalletTxnParams) =>
    ['admin', 'wallet', userId, 'txns', params] as const,
  providers: ['admin', 'courier-providers'] as const,
  company: ['admin', 'company'] as const,
  lookupProviders: ['admin', 'lookups', 'providers'] as const,
  lookupCountries: ['admin', 'lookups', 'countries'] as const,
  lookupStaff: ['admin', 'lookups', 'staff'] as const,
  customersRoot: ['admin', 'customers'] as const,
  customerList: (params: ListCustomersParams) => ['admin', 'customers', 'list', params] as const,
  customer: (id: string) => ['admin', 'customers', 'detail', id] as const,
  bookingsRoot: ['admin', 'bookings'] as const,
  bookingList: (params: ListAdminBookingsParams) => ['admin', 'bookings', 'list', params] as const,
  booking: (id: string) => ['admin', 'bookings', 'detail', id] as const,
  activityRoot: ['admin', 'activity'] as const,
  activity: (params: ListActivityParams) => ['admin', 'activity', params] as const,
}

// --- roles & permissions ----------------------------------------------------

export function usePermissionCatalog(enabled = true) {
  return useQuery({
    queryKey: adminKeys.permissions,
    queryFn: listPermissions,
    staleTime: 10 * 60 * 1000,
    enabled,
  })
}

export function useRoles(enabled = true) {
  return useQuery({ queryKey: adminKeys.roles, queryFn: listRoles, enabled })
}

function useInvalidateRoles() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: adminKeys.roles })
    // Role changes show up in staff role chips and permissions.
    qc.invalidateQueries({ queryKey: adminKeys.staffRoot })
  }
}

export function useCreateRole() {
  const invalidate = useInvalidateRoles()
  return useMutation({ mutationFn: (input: RoleInput) => createRole(input), onSuccess: invalidate })
}

export function useUpdateRole() {
  const invalidate = useInvalidateRoles()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RoleInput> }) => updateRole(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteRole() {
  const invalidate = useInvalidateRoles()
  return useMutation({ mutationFn: (id: string) => deleteRole(id), onSuccess: invalidate })
}

// --- staff ------------------------------------------------------------------

export function useStaffList(params: ListStaffParams) {
  return useQuery({
    queryKey: adminKeys.staffList(params),
    queryFn: () => listStaff(params),
    placeholderData: (prev) => prev,
  })
}

export function useStaffDetail(id: string | null) {
  return useQuery({
    queryKey: adminKeys.staff(id ?? ''),
    queryFn: () => getStaff(id as string),
    enabled: !!id,
  })
}

function useInvalidateStaff() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: adminKeys.staffRoot })
    qc.invalidateQueries({ queryKey: adminKeys.roles }) // staffCount
  }
}

export function useCreateStaff() {
  const invalidate = useInvalidateStaff()
  return useMutation({
    mutationFn: (input: CreateStaffInput) => createStaff(input),
    onSuccess: invalidate,
  })
}

export function useUpdateStaff() {
  const invalidate = useInvalidateStaff()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStaffInput }) => updateStaff(id, input),
    onSuccess: invalidate,
  })
}

export function useResetStaffPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetStaffPassword(id, password),
  })
}

// --- customer wallet --------------------------------------------------------

export function useCustomerWallet(userId: string) {
  return useQuery({
    queryKey: adminKeys.wallet(userId),
    queryFn: () => getCustomerWallet(userId),
    enabled: !!userId,
  })
}

export function useCustomerWalletTransactions(userId: string, params: ListAdminWalletTxnParams) {
  return useQuery({
    queryKey: adminKeys.walletTxns(userId, params),
    queryFn: () => listCustomerWalletTransactions(userId, params),
    enabled: !!userId,
    placeholderData: (prev) => prev,
  })
}

export function useAddWalletTransaction(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddWalletTransactionInput) => addWalletTransaction(userId, input),
    onSuccess: () => invalidateWallet(qc, userId),
  })
}

export function useUpdateCreditLimit(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (creditLimit: number) => updateCreditLimit(userId, creditLimit),
    onSuccess: () => invalidateWallet(qc, userId),
  })
}

/** The balance also shows on the customer list/detail, and the change is logged. */
function invalidateWallet(qc: ReturnType<typeof useQueryClient>, userId: string) {
  qc.invalidateQueries({ queryKey: adminKeys.wallet(userId) })
  qc.invalidateQueries({ queryKey: adminKeys.customersRoot })
  qc.invalidateQueries({ queryKey: adminKeys.activityRoot })
}

// --- courier providers ------------------------------------------------------

export function useAdminCourierProviders() {
  return useQuery({ queryKey: adminKeys.providers, queryFn: listAdminCourierProviders })
}

function useInvalidateProviders() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: adminKeys.providers })
    qc.invalidateQueries({ queryKey: queryKeys.courierProviders })
  }
}

export function useCreateCourierProvider() {
  const invalidate = useInvalidateProviders()
  return useMutation({
    mutationFn: (input: CourierProviderInput) => createCourierProvider(input),
    onSuccess: invalidate,
  })
}

export function useUpdateCourierProvider() {
  const invalidate = useInvalidateProviders()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CourierProviderInput> }) =>
      updateCourierProvider(id, input),
    onSuccess: invalidate,
  })
}

export function useSetCourierProviderStatus() {
  const qc = useQueryClient()
  const invalidate = useInvalidateProviders()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProviderStatus }) =>
      setCourierProviderStatus(id, status),
    // Optimistic so the status switch flips instantly.
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: adminKeys.providers })
      const previous = qc.getQueryData<AdminCourierProvider[]>(adminKeys.providers)
      if (previous) {
        qc.setQueryData<AdminCourierProvider[]>(
          adminKeys.providers,
          previous.map((p) => (p.id === id ? { ...p, status } : p)),
        )
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(adminKeys.providers, ctx.previous)
    },
    onSettled: invalidate,
  })
}

// --- company settings -------------------------------------------------------

export function useCompanySettings() {
  return useQuery({ queryKey: adminKeys.company, queryFn: getCompanySettings })
}

export function useSaveCompanyProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CompanyProfileInput) => saveCompanyProfile(input),
    onSuccess: (profile) =>
      qc.setQueryData<CompanySettings>(adminKeys.company, (prev) =>
        prev ? { ...prev, profile } : prev,
      ),
  })
}

export function useCreateBankAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BankAccountInput) => createBankAccount(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.company }),
  })
}

export function useUpdateBankAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BankAccountInput> }) =>
      updateBankAccount(id, input),
    // Refetch rather than merge: the server decides the active-first ordering.
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.company }),
  })
}

// --- lookups ----------------------------------------------------------------

const LOOKUP_STALE = 5 * 60 * 1000

export function useLookupProviders() {
  return useQuery({
    queryKey: adminKeys.lookupProviders,
    queryFn: lookupCourierProviders,
    staleTime: LOOKUP_STALE,
  })
}

export function useLookupCountries() {
  return useQuery({
    queryKey: adminKeys.lookupCountries,
    queryFn: lookupCountries,
    staleTime: LOOKUP_STALE,
  })
}

export function useLookupStaff() {
  return useQuery({
    queryKey: adminKeys.lookupStaff,
    queryFn: lookupStaff,
    staleTime: LOOKUP_STALE,
  })
}

// --- customers --------------------------------------------------------------

export function useCustomers(params: ListCustomersParams) {
  return useQuery({
    queryKey: adminKeys.customerList(params),
    queryFn: () => listCustomers(params),
    placeholderData: (prev) => prev,
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: adminKeys.customer(id),
    queryFn: () => getCustomer(id),
    enabled: !!id,
  })
}

function useCustomerCacheWriter() {
  const qc = useQueryClient()
  return (customer: Customer) => {
    qc.setQueryData(adminKeys.customer(customer.id), customer)
    qc.invalidateQueries({ queryKey: adminKeys.customersRoot })
    qc.invalidateQueries({ queryKey: adminKeys.activityRoot })
  }
}

export function useCreateCustomer() {
  const write = useCustomerCacheWriter()
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => createCustomer(input),
    onSuccess: write,
  })
}

export function useUpdateCustomer(id: string) {
  const write = useCustomerCacheWriter()
  return useMutation({
    mutationFn: (input: UpdateCustomerInput) => updateCustomer(id, input),
    onSuccess: write,
  })
}

export function useSetCustomerStatus(id: string) {
  const write = useCustomerCacheWriter()
  return useMutation({
    mutationFn: (isActive: boolean) => setCustomerStatus(id, isActive),
    onSuccess: write,
  })
}

export function useResetCustomerPassword(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (password: string) => resetCustomerPassword(id, password),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.activityRoot }),
  })
}

// --- bookings ---------------------------------------------------------------

export function useAdminBookings(params: ListAdminBookingsParams, enabled = true) {
  return useQuery({
    queryKey: adminKeys.bookingList(params),
    queryFn: () => listAdminBookings(params),
    placeholderData: (prev) => prev,
    enabled,
  })
}

export function useAdminBooking(id: string) {
  return useQuery({
    queryKey: adminKeys.booking(id),
    queryFn: () => getAdminBooking(id),
    enabled: !!id,
    // Several staff may work on the same booking; always load the latest.
    staleTime: 0,
  })
}

/** After any booking write: money, counts and history may all have moved. */
function useBookingWriteEffects() {
  const qc = useQueryClient()
  return (booking: AdminBookingDetail) => {
    qc.setQueryData(adminKeys.booking(booking.id), booking)
    qc.invalidateQueries({ queryKey: adminKeys.bookingsRoot })
    qc.invalidateQueries({ queryKey: adminKeys.customersRoot })
    qc.invalidateQueries({ queryKey: adminKeys.wallet(booking.customer.id) })
    qc.invalidateQueries({ queryKey: adminKeys.activityRoot })
  }
}

export function useUpdateAdminBooking(id: string) {
  const after = useBookingWriteEffects()
  return useMutation({
    mutationFn: (input: UpdateBookingInput & Concurrency) => updateAdminBooking(id, input),
    onSuccess: after,
  })
}

export function useUpdateAdminBookingParties(id: string) {
  const after = useBookingWriteEffects()
  return useMutation({
    mutationFn: (input: PartiesInput & Concurrency) => updateAdminBookingParties(id, input),
    onSuccess: after,
  })
}

export function useUpdateAdminBookingKyc(id: string) {
  const after = useBookingWriteEffects()
  return useMutation({
    mutationFn: (input: AdminKycInput & Concurrency) => updateAdminBookingKyc(id, input),
    onSuccess: after,
  })
}

export function useCancelAdminBooking(id: string) {
  const after = useBookingWriteEffects()
  return useMutation({
    mutationFn: (input: { reason?: string } & Concurrency) => cancelAdminBooking(id, input),
    onSuccess: after,
  })
}

export function useDeleteAdminBooking(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => deleteAdminBooking(id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: adminKeys.booking(id) })
      qc.invalidateQueries({ queryKey: adminKeys.bookingsRoot })
      qc.invalidateQueries({ queryKey: adminKeys.customersRoot })
      qc.invalidateQueries({ queryKey: adminKeys.activityRoot })
    },
  })
}

/** The edit was based on stale data: another admin changed the booking. */
export function isStaleBookingError(error: unknown): boolean {
  return error instanceof Error && /changed by someone else/i.test(error.message)
}

// --- activity log -----------------------------------------------------------

export function useActivityLogs(params: ListActivityParams, enabled = true) {
  return useQuery({
    queryKey: adminKeys.activity(params),
    queryFn: () => listActivityLogs(params),
    placeholderData: (prev) => prev,
    staleTime: 0,
    enabled,
  })
}
