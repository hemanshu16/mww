import { useState } from 'react'
import { AlertTriangle, Building2, Landmark, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { useCompanySettings, useUpdateBankAccount } from '@/admin/hooks'
import { CompanyProfileDialog } from '@/admin/components/company/CompanyProfileDialog'
import { BankAccountDialog } from '@/admin/components/company/BankAccountDialog'
import type { BankAccount } from '@/admin/types'
import { getApiErrorMessage } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function ProfileRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

export default function CompanySettingsPage() {
  const { can } = useStaffAuth()
  const canUpdate = can('company_settings.update')
  const { data, isLoading, isError, error } = useCompanySettings()
  const setActive = useUpdateBankAccount()

  const [profileOpen, setProfileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [editing, setEditing] = useState<BankAccount | null>(null)
  const [deactivating, setDeactivating] = useState<BankAccount | null>(null)

  const profile = data?.profile ?? null
  const accounts = data?.bankAccounts ?? []
  const activeCount = accounts.filter((a) => a.isActive).length
  const columns = canUpdate ? 7 : 6

  const openAdd = () => {
    setEditing(null)
    setAccountOpen(true)
  }

  const toggleActive = (a: BankAccount, isActive: boolean) =>
    setActive.mutate(
      { id: a.id, input: { isActive } },
      {
        onSuccess: () =>
          toast.success(
            isActive
              ? `${a.bankName} account is now shown to customers.`
              : `${a.bankName} account is now hidden from customers.`,
          ),
        onError: (err) => toast.error(getApiErrorMessage(err, 'Could not change the status.')),
        onSettled: () => setDeactivating(null),
      },
    )

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Company settings" />
        <Card>
          <CardContent className="py-12 text-center text-sm text-destructive">
            {getApiErrorMessage(error, "Couldn't load company settings. Please try again.")}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company settings"
        description="Your company's legal details and the bank accounts customers pay into."
      />

      {/* Company profile */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-[10px] bg-[#eff6ff] text-primary">
                <Building2 className="size-5" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Company profile</h2>
                {profile && (
                  <p className="text-xs text-muted-foreground">
                    Updated {formatDateTime(profile.updatedAt)}
                  </p>
                )}
              </div>
            </div>
            {canUpdate && profile && (
              <Button variant="outline" size="sm" onClick={() => setProfileOpen(true)}>
                <Pencil className="size-4" /> Edit
              </Button>
            )}
          </div>

          <div className="mt-5">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-80" />
                <Skeleton className="h-5 w-56" />
              </div>
            ) : profile ? (
              <dl className="space-y-3">
                <ProfileRow label="Legal name" value={profile.legalName} />
                <ProfileRow
                  label="GST number"
                  value={
                    profile.gstNumber ? (
                      <span className="font-mono">{profile.gstNumber}</span>
                    ) : (
                      <span className="font-normal text-muted-foreground">Not set</span>
                    )
                  }
                />
              </dl>
            ) : (
              <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Company profile not set up yet. Customers won&apos;t see your company name or GST
                  number.
                </p>
                {canUpdate && (
                  <Button size="sm" onClick={() => setProfileOpen(true)}>
                    Set up profile
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank accounts */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Bank accounts</h2>
          <p className="text-sm text-muted-foreground">
            Active accounts are shown to customers. Accounts can&apos;t be deleted; deactivate one
            to retire it.
          </p>
        </div>
        {canUpdate && (
          <Button onClick={openAdd}>
            <Plus className="size-4" /> Add bank account
          </Button>
        )}
      </div>

      {!isLoading && accounts.length > 0 && activeCount === 0 && (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertDescription>
            No active bank accounts. Customers have no account to pay into.
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Bank</TableHead>
              <TableHead className="hidden lg:table-cell">Account name</TableHead>
              <TableHead>Account no.</TableHead>
              <TableHead className="hidden sm:table-cell">IFSC</TableHead>
              <TableHead className="hidden md:table-cell">Branch</TableHead>
              <TableHead>Status</TableHead>
              {canUpdate && (
                <TableHead className="w-28">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: columns }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : accounts.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns} className="p-0">
                  <EmptyState
                    icon={Landmark}
                    title="No bank accounts yet"
                    description="Add one so customers know where to pay."
                    action={
                      canUpdate && (
                        <Button onClick={openAdd}>
                          <Plus className="size-4" /> Add bank account
                        </Button>
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((a) => (
                <TableRow
                  key={a.id}
                  className={cn(!a.isActive && 'bg-[#fbfcfe]')}
                  title={a.isActive ? undefined : 'Hidden from customers'}
                >
                  <TableCell className={cn(!a.isActive && 'opacity-60')}>
                    <span className="font-medium text-foreground">{a.bankName}</span>
                    <span className="block max-w-[180px] truncate text-xs text-muted-foreground lg:hidden">
                      {a.accountName}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      'hidden max-w-[240px] truncate text-sm lg:table-cell',
                      !a.isActive && 'opacity-60',
                    )}
                  >
                    {a.accountName}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'font-mono text-[13px] tabular-nums',
                      !a.isActive && 'opacity-60',
                    )}
                  >
                    {a.accountNumber}
                    <span className="block text-xs text-muted-foreground sm:hidden">
                      {a.ifscCode}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      'hidden font-mono text-[13px] sm:table-cell',
                      !a.isActive && 'opacity-60',
                    )}
                  >
                    {a.ifscCode}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'hidden text-sm text-muted-foreground md:table-cell',
                      !a.isActive && 'opacity-60',
                    )}
                  >
                    {a.branchName ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.isActive ? 'success' : 'draft'}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {canUpdate && (
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Edit ${a.bankName} account`}
                          onClick={() => {
                            setEditing(a)
                            setAccountOpen(true)
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Switch
                          checked={a.isActive}
                          aria-label={`${a.bankName} account active`}
                          disabled={setActive.isPending && setActive.variables?.id === a.id}
                          onCheckedChange={(on) =>
                            on ? toggleActive(a, true) : setDeactivating(a)
                          }
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <CompanyProfileDialog open={profileOpen} onOpenChange={setProfileOpen} profile={profile} />
      <BankAccountDialog
        open={accountOpen}
        onOpenChange={setAccountOpen}
        account={editing}
        legalName={profile?.legalName}
      />

      <Dialog open={!!deactivating} onOpenChange={(o) => !o && setDeactivating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate this account?</DialogTitle>
            <DialogDescription>
              {deactivating?.bankName} · {deactivating?.accountNumber}. Customers will no longer see
              this account. Continue?
            </DialogDescription>
          </DialogHeader>
          {deactivating?.isActive && activeCount === 1 && (
            <Alert variant="warning">
              <AlertTriangle />
              <AlertDescription>
                This is the last active account. Customers will have no bank account to pay into.
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Keep active</Button>
            </DialogClose>
            <Button
              variant="destructive"
              loading={setActive.isPending}
              onClick={() => deactivating && toggleActive(deactivating, false)}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
