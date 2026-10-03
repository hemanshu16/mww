import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Pencil } from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { useAdminCourierProvider } from '@/admin/hooks'
import { CourierProviderDialog } from '@/admin/components/CourierProviderDialog'
import { ProviderLogo, ProviderStatusSwitch } from '@/admin/components/CourierProviderBits'
import { MarginSlabsCard } from '@/admin/components/MarginSlabsCard'
import { ActivityHistory } from '@/admin/components/activity/ActivityList'
import { ApiRequestError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function CourierProviderDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { can } = useStaffAuth()
  const { data: provider, isLoading, isError, error } = useAdminCourierProvider(id)
  const [editOpen, setEditOpen] = useState(false)

  const back = (
    <Link
      to="/admin/courier-providers"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Courier providers
    </Link>
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !provider) {
    const notFound = error instanceof ApiRequestError && [400, 404].includes(error.status)
    return (
      <div className="space-y-6">
        {back}
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-medium">
              {notFound ? 'Provider not found' : 'Something went wrong'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {notFound ? 'It may have been removed.' : 'Please try again.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canEdit = can('courier_provider.update')
  const active = provider.status === 'ACTIVE'

  return (
    <div className="space-y-6">
      {back}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <ProviderLogo provider={provider} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[26px] font-bold leading-[34px] tracking-[-0.02em] text-foreground">
                {provider.name}
              </h1>
              <Badge variant={active ? 'success' : 'draft'}>{active ? 'Active' : 'Inactive'}</Badge>
              {provider.isGstApplicable ? (
                <Badge variant="info">GST</Badge>
              ) : (
                <Badge variant="draft">No GST</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Added {formatDateTime(provider.createdAt)} · Updated{' '}
              {formatDateTime(provider.updatedAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {can('courier_provider.update_status') && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <ProviderStatusSwitch provider={provider} />
              Shown to customers
            </label>
          )}
          {canEdit && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
          )}
        </div>
      </div>

      <MarginSlabsCard providerId={provider.id} slabs={provider.marginSlabs} canEdit={canEdit} />

      {can('audit_log.read') && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">History</h2>
          <ActivityHistory entityType="COURIER_PROVIDER" entityId={provider.id} />
        </section>
      )}

      <CourierProviderDialog open={editOpen} onOpenChange={setEditOpen} provider={provider} />
    </div>
  )
}
