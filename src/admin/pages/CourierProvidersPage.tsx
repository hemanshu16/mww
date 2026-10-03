import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Truck } from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { useAdminCourierProviders } from '@/admin/hooks'
import { CourierProviderDialog } from '@/admin/components/CourierProviderDialog'
import { ProviderLogo, ProviderStatusSwitch } from '@/admin/components/CourierProviderBits'
import type { AdminCourierProvider } from '@/admin/types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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

export default function CourierProvidersPage() {
  const { can } = useStaffAuth()
  const { data: providers = [], isLoading, isError } = useAdminCourierProviders()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCourierProvider | null>(null)

  const canCreate = can('courier_provider.create')
  const canEdit = can('courier_provider.update')
  const canToggle = can('courier_provider.update_status')
  const columns = canEdit ? 5 : 4

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courier providers"
        description="Carriers customers can book with. Open a provider to manage its margin slabs."
        actions={
          canCreate && (
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Add provider
            </Button>
          )
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Provider</TableHead>
              <TableHead className="hidden sm:table-cell">GST</TableHead>
              <TableHead className="hidden md:table-cell">Added</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: columns }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns} className="py-12 text-center text-sm text-destructive">
                  Couldn&apos;t load courier providers. Please try again.
                </TableCell>
              </TableRow>
            ) : providers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns} className="p-0">
                  <EmptyState
                    icon={Truck}
                    title="No courier providers yet"
                    description="Add the first carrier customers can book with."
                    action={
                      canCreate && (
                        <Button onClick={openCreate}>
                          <Plus className="size-4" /> Add provider
                        </Button>
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              providers.map((p) => {
                const active = p.status === 'ACTIVE'
                return (
                  <TableRow key={p.id} className={cn(!active && 'bg-[#fbfcfe]')}>
                    <TableCell>
                      <div className={cn('flex items-center gap-3', !active && 'opacity-60')}>
                        <ProviderLogo provider={p} />
                        <Link
                          to={`/admin/courier-providers/${p.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {p.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {p.isGstApplicable ? (
                        <Badge variant="booked">GST</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">No GST</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {formatDate(p.createdAt)}
                    </TableCell>
                    <TableCell>
                      {canToggle ? (
                        <div className="flex items-center gap-2">
                          <ProviderStatusSwitch provider={p} />
                          <span className="hidden text-xs text-muted-foreground lg:inline">
                            {active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ) : (
                        <Badge variant={active ? 'success' : 'draft'}>
                          {active ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Edit ${p.name}`}
                          onClick={() => {
                            setEditing(p)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <CourierProviderDialog open={dialogOpen} onOpenChange={setDialogOpen} provider={editing} />
    </div>
  )
}
