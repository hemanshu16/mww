import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, KeyRound, Loader2, Pencil } from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { useAdminBookings, useCustomer, useSetCustomerStatus } from '@/admin/hooks'
import { EditCustomerDialog } from '@/admin/components/customers/EditCustomerDialog'
import { CustomerPasswordDialog } from '@/admin/components/customers/CustomerPasswordDialog'
import { CustomerWalletTab } from '@/admin/components/customers/CustomerWalletTab'
import { AdminBookingsTable } from '@/admin/components/bookings/AdminBookingsTable'
import { ActivityHistory } from '@/admin/components/activity/ActivityList'
import type { Customer } from '@/admin/types'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { formatDate, formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
    </div>
  )
}

function Overview({ customer }: { customer: Customer }) {
  const w = customer.wallet
  const b = customer.bookings
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              {customer.firstName} {customer.lastName}
            </Field>
            <Field label="Company">{customer.companyName}</Field>
            <Field label="Email">
              {customer.email}{' '}
              {!customer.isEmailVerified && (
                <Badge variant="gold" className="ml-1">
                  Unverified
                </Badge>
              )}
            </Field>
            <Field label="Phone">{customer.phoneNumber}</Field>
            <Field label="GST billing">{customer.isGstBilling ? 'Yes' : 'No'}</Field>
            <Field label="Joined">{formatDate(customer.createdAt)}</Field>
          </dl>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <Field label={w.balance < 0 ? 'Balance (Due)' : 'Balance'}>
                <span
                  className={cn('font-semibold tabular-nums', w.balance < 0 && 'text-[#b91c1c]')}
                >
                  {formatINR(w.balance)}
                </span>
              </Field>
              <Field label="Available">
                <span className="tabular-nums">{formatINR(w.availableBalance)}</span>
              </Field>
              <Field label="Credit limit">
                <span className="tabular-nums">{formatINR(w.creditLimit)}</span>
              </Field>
              {w.outstandingAmount > 0 && (
                <Field label="Outstanding">
                  <span className="tabular-nums text-[#b45309]">
                    {formatINR(w.outstandingAmount)}
                  </span>
                </Field>
              )}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-4 gap-2 text-center">
              {(
                [
                  ['Total', b.total],
                  ['Draft', b.DRAFT],
                  ['Booked', b.BOOKED],
                  ['Cancelled', b.CANCELLED],
                ] as const
              ).map(([label, n]) => (
                <div key={label}>
                  <dd className="text-lg font-semibold tabular-nums">{n}</dd>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CustomerBookings({ customerId }: { customerId: string }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useAdminBookings({ customerId, page, limit: 20 })
  return (
    <AdminBookingsTable
      items={data?.items ?? []}
      pagination={data?.pagination}
      page={page}
      onPage={setPage}
      isLoading={isLoading}
      isError={isError}
      filtered={false}
      showCustomer={false}
    />
  )
}

export default function CustomerDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { can } = useStaffAuth()
  const [params, setParams] = useSearchParams()
  const { data: customer, isLoading, isError, error } = useCustomer(id)
  const setStatus = useSetCustomerStatus(id)

  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const tabs = [
    { value: 'overview', label: 'Overview', show: true },
    { value: 'wallet', label: 'Wallet', show: can('wallet.read') },
    { value: 'bookings', label: 'Bookings', show: can('booking.read') },
    { value: 'history', label: 'History', show: can('audit_log.read') },
  ].filter((t) => t.show)
  const requested = params.get('tab') ?? 'overview'
  const tab = tabs.some((t) => t.value === requested) ? requested : 'overview'
  // Each tab keeps its own filters; switching resets them.
  const changeTab = (value: string) => setParams(value === 'overview' ? {} : { tab: value })

  const back = (
    <Link
      to="/admin/customers"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Customers
    </Link>
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !customer) {
    const notFound = error instanceof ApiRequestError && [400, 404].includes(error.status)
    return (
      <div className="space-y-6">
        {back}
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-medium">
              {notFound ? 'Customer not found' : 'Something went wrong'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {notFound ? 'This customer may not exist.' : 'Please try again.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const changeStatus = (isActive: boolean) =>
    setStatus.mutate(isActive, {
      onSuccess: () =>
        toast.success(
          isActive
            ? `${customer.firstName} can sign in again.`
            : `${customer.firstName} is deactivated and signed out.`,
        ),
      onError: (err) => toast.error(getApiErrorMessage(err, 'Could not change the status.')),
      onSettled: () => setConfirmDeactivate(false),
    })

  const canUpdate = can('customer.update')
  const name = `${customer.firstName} ${customer.lastName}`

  return (
    <div className="space-y-6">
      {back}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-[26px] font-bold leading-[34px] tracking-[-0.02em] text-foreground">
              {customer.companyName}
            </h1>
            <Badge variant={customer.isActive ? 'success' : 'draft'}>
              {customer.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {name} · {customer.email}
          </p>
        </div>
        {canUpdate && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="mr-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={customer.isActive}
                disabled={setStatus.isPending}
                onCheckedChange={(on) => (on ? changeStatus(true) : setConfirmDeactivate(true))}
                aria-label="Customer active"
              />
              Active
            </label>
            <Button variant="outline" onClick={() => setPasswordOpen(true)}>
              <KeyRound className="size-4" /> Reset password
            </Button>
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
          </div>
        )}
      </div>

      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList className="h-auto flex-wrap justify-start">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <Overview customer={customer} />
        </TabsContent>
        {can('wallet.read') && (
          <TabsContent value="wallet" className="mt-6">
            <CustomerWalletTab userId={customer.id} customerName={customer.companyName || name} />
          </TabsContent>
        )}
        {can('booking.read') && (
          <TabsContent value="bookings" className="mt-6">
            <CustomerBookings customerId={customer.id} />
          </TabsContent>
        )}
        {can('audit_log.read') && (
          <TabsContent value="history" className="mt-6">
            <ActivityHistory entityType="CUSTOMER" entityId={customer.id} />
          </TabsContent>
        )}
      </Tabs>

      {canUpdate && (
        <>
          <EditCustomerDialog customer={customer} open={editOpen} onOpenChange={setEditOpen} />
          <CustomerPasswordDialog
            customer={customer}
            open={passwordOpen}
            onOpenChange={setPasswordOpen}
          />
        </>
      )}

      <Dialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate {name}?</DialogTitle>
            <DialogDescription>
              The customer will be logged out and cannot log in until reactivated. Their bookings
              and wallet history are kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Keep active</Button>
            </DialogClose>
            <Button
              variant="destructive"
              loading={setStatus.isPending}
              onClick={() => changeStatus(false)}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
