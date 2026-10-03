import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react'
import { requestAdminKycDownloadUrl, requestAdminKycUploadUrl } from '@/admin/api'
import { isStaleBookingError, useUpdateAdminBookingKyc } from '@/admin/hooks'
import { useStaffAuth } from '@/admin/staffAuthContext'
import type { AdminBookingDetail, AdminKycInput } from '@/admin/types'
import { getApiErrorMessage } from '@/lib/api/client'
import { KYC_ACCEPT, KYC_MAX_BYTES, uploadKycFile } from '@/lib/api/uploads'
import { kycFileName } from '@/lib/format'
import { openPendingTab } from '@/lib/pendingTab'
import { KYC_TYPE_LABELS, KYC_TYPES, type KycType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type DocField = 'kyc1DocFront' | 'kyc1DocBack' | 'kyc2Doc'

const DOC_LABELS: Record<DocField, string> = {
  kyc1DocFront: 'KYC 1 front',
  kyc1DocBack: 'KYC 1 back',
  kyc2Doc: 'KYC 2 document',
}

const isImage = (path: string) => /\.(png|jpe?g|webp|gif)$/i.test(path)

/** Radix Select can't hold an empty value. */
const NO_TYPE = 'NONE'

/**
 * Shipper KYC on the admin booking detail: view each document, and with
 * `booking.update` edit type / number and upload, replace or remove files.
 */
export function AdminKycSection({
  booking,
  onStale,
}: {
  booking: AdminBookingDetail
  onStale: () => void
}) {
  const { can } = useStaffAuth()
  const update = useUpdateAdminBookingKyc(booking.id)
  const [editOpen, setEditOpen] = useState(false)
  const [removing, setRemoving] = useState<DocField | null>(null)
  const [preview, setPreview] = useState<{ label: string; url: string } | null>(null)

  const shipper = booking.shipper
  if (!shipper) return null

  const canView = can('booking.read')
  const canEdit = can('booking.update') && booking.status !== 'CANCELLED'

  /** PATCH and report; true when saved. */
  const save = async (input: AdminKycInput, success: string) => {
    try {
      await update.mutateAsync({ ...input, expectedUpdatedAt: booking.updatedAt })
      toast.success(success)
      return true
    } catch (err) {
      if (isStaleBookingError(err)) onStale()
      else toast.error(getApiErrorMessage(err, 'Could not update KYC.'))
      return false
    }
  }

  const view = async (field: DocField, path: string) => {
    // Images preview in a dialog. PDFs open in a tab, opened now while we still
    // have the click (or it gets blocked); it shows a loader until the link arrives.
    const image = isImage(path)
    const tab = image ? null : openPendingTab(DOC_LABELS[field])
    try {
      const { signedUrl } = await requestAdminKycDownloadUrl(booking.id, path)
      if (image) setPreview({ label: DOC_LABELS[field], url: signedUrl })
      else if (tab) tab.go(signedUrl)
      else if (!window.open(signedUrl, '_blank', 'noopener')) {
        toast.error('Allow pop-ups for this site to view PDF documents.')
      }
    } catch (err) {
      tab?.close()
      toast.error(getApiErrorMessage(err, 'Could not open the document.'))
    }
  }

  const docProps = (field: DocField) => ({
    bookingId: booking.id,
    field,
    path: shipper[field],
    canView,
    canEdit,
    saving: update.isPending,
    onView: view,
    onUploaded: (path: string) =>
      save({ [field]: path }, `${DOC_LABELS[field]} ${shipper[field] ? 'replaced' : 'uploaded'}.`),
    onRemove: () => setRemoving(field),
  })

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">KYC documents</h4>
        {canEdit && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" /> Edit details
          </Button>
        )}
      </div>

      <KycBlock title="KYC 1" type={shipper.kyc1Type} number={shipper.kyc1Number}>
        <DocSlot label="Front" {...docProps('kyc1DocFront')} />
        <DocSlot label="Back" {...docProps('kyc1DocBack')} />
      </KycBlock>
      <KycBlock title="KYC 2" type={shipper.kyc2Type} number={shipper.kyc2Number}>
        <DocSlot label="Document" {...docProps('kyc2Doc')} />
      </KycBlock>

      {editOpen && (
        <EditKycDialog
          booking={booking}
          saving={update.isPending}
          onClose={() => setEditOpen(false)}
          onSave={async (input) => {
            if (await save(input, 'KYC details updated.')) setEditOpen(false)
          }}
        />
      )}

      <Dialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removing ? DOC_LABELS[removing].toLowerCase() : ''}?</DialogTitle>
            <DialogDescription>
              The file is detached from this booking. You can upload a new one afterwards.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Keep it</Button>
            </DialogClose>
            <Button
              variant="destructive"
              loading={update.isPending}
              onClick={async () => {
                if (!removing) return
                await save({ [removing]: null }, `${DOC_LABELS[removing]} removed.`)
                setRemoving(null)
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.label}</DialogTitle>
          </DialogHeader>
          {preview && (
            <img
              src={preview.url}
              alt={preview.label}
              className="max-h-[70vh] w-full rounded-md border border-border object-contain"
            />
          )}
          <DialogFooter>
            {preview && (
              <Button variant="outline" asChild>
                <a href={preview.url} target="_blank" rel="noopener noreferrer">
                  Open in new tab
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function KycBlock({
  title,
  type,
  number,
  children,
}: {
  title: string
  type: KycType | null
  number: string | null
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3 rounded-[10px] border border-border p-3">
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-muted-foreground">{title} type</dt>
          <dd className="mt-0.5 text-sm">{type ? KYC_TYPE_LABELS[type] : '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{title} number</dt>
          <dd className="mt-0.5 break-all text-sm">{number || '—'}</dd>
        </div>
      </dl>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function DocSlot({
  label,
  bookingId,
  field,
  path,
  canView,
  canEdit,
  saving,
  onView,
  onUploaded,
  onRemove,
}: {
  label: string
  bookingId: string
  field: DocField
  path: string | null
  canView: boolean
  canEdit: boolean
  saving: boolean
  onView: (field: DocField, path: string) => Promise<void>
  onUploaded: (path: string) => Promise<boolean>
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [opening, setOpening] = useState(false)
  const busy = progress !== null

  const handleFile = async (file: File) => {
    if (file.size > KYC_MAX_BYTES) {
      toast.error('File too large. Maximum size is 10 MB.')
      return
    }
    setProgress(0)
    try {
      const uploaded = await uploadKycFile(
        file,
        (f) => setProgress(Math.round(f * 100)),
        (name, type) => requestAdminKycUploadUrl(bookingId, name, type),
      )
      // Uploading alone changes nothing; the PATCH saves it on the booking.
      await onUploaded(uploaded)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Upload failed.'))
    } finally {
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const Icon = path && isImage(path) ? ImageIcon : FileText

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={KYC_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
        {busy ? (
          <p className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Uploading… {progress}%
          </p>
        ) : path ? (
          <p className="flex min-w-0 items-center gap-2 text-sm">
            <Icon className="size-4 shrink-0 text-primary" />
            <span className="truncate" title={kycFileName(path)}>
              {kycFileName(path)}
            </span>
          </p>
        ) : (
          <p className="py-1 text-sm text-muted-foreground">Not uploaded</p>
        )}

        {!busy && (path ? canView || canEdit : canEdit) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {path && canView && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                loading={opening}
                onClick={async () => {
                  setOpening(true)
                  await onView(field, path)
                  setOpening(false)
                }}
              >
                <Eye className="size-3.5" /> View
              </Button>
            )}
            {canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                disabled={saving}
                onClick={() => inputRef.current?.click()}
              >
                {path ? <RefreshCw className="size-3.5" /> : <Upload className="size-3.5" />}
                {path ? 'Replace' : 'Upload'}
              </Button>
            )}
            {path && canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={saving}
                onClick={onRemove}
                aria-label={`Remove ${label.toLowerCase()}`}
              >
                <Trash2 className="size-3.5" /> Remove
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EditKycDialog({
  booking,
  saving,
  onClose,
  onSave,
}: {
  booking: AdminBookingDetail
  saving: boolean
  onClose: () => void
  onSave: (input: AdminKycInput) => void
}) {
  const shipper = booking.shipper!
  const [values, setValues] = useState({
    kyc1Type: shipper.kyc1Type ?? NO_TYPE,
    kyc1Number: shipper.kyc1Number ?? '',
    kyc2Type: shipper.kyc2Type ?? NO_TYPE,
    kyc2Number: shipper.kyc2Number ?? '',
  })
  const set = (key: keyof typeof values) => (v: string) => setValues((s) => ({ ...s, [key]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // Send only what changed; blank clears.
    const next: AdminKycInput = {
      kyc1Type: values.kyc1Type === NO_TYPE ? null : (values.kyc1Type as KycType),
      kyc1Number: values.kyc1Number.trim() || null,
      kyc2Type: values.kyc2Type === NO_TYPE ? null : (values.kyc2Type as KycType),
      kyc2Number: values.kyc2Number.trim() || null,
    }
    const changed = Object.fromEntries(
      Object.entries(next).filter(([k, v]) => v !== (shipper[k as keyof AdminKycInput] ?? null)),
    ) as AdminKycInput
    if (Object.keys(changed).length === 0) onClose()
    else onSave(changed)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Edit KYC details</DialogTitle>
            <DialogDescription>
              Type and number of the shipper&apos;s ID documents. Leave a number blank to clear it.
            </DialogDescription>
          </DialogHeader>
          {([1, 2] as const).map((n) => {
            const typeKey = `kyc${n}Type` as const
            const numberKey = `kyc${n}Number` as const
            return (
              <fieldset key={n} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <legend className="mb-2 text-sm font-semibold">KYC {n}</legend>
                <div className="space-y-1.5">
                  <Label htmlFor={`kyc${n}-type`}>Type</Label>
                  <Select value={values[typeKey]} onValueChange={set(typeKey)}>
                    <SelectTrigger id={`kyc${n}-type`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_TYPE}>None</SelectItem>
                      {KYC_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {KYC_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`kyc${n}-number`}>Number</Label>
                  <Input
                    id={`kyc${n}-number`}
                    autoComplete="off"
                    value={values[numberKey]}
                    onChange={(e) => set(numberKey)(e.target.value)}
                  />
                </div>
              </fieldset>
            )
          })}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
