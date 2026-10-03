import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Download, Eye, FileStack, FileText } from 'lucide-react'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import type { DocumentLink, DocumentType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { openPendingTab } from '@/lib/pendingTab'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type FetchLink = (type: DocumentType, download: boolean) => Promise<DocumentLink>
type Doc = { type: DocumentType; label: string; hint: string }

const DOCUMENTS: Doc[] = [
  { type: 'airway-bill', label: 'Airway bill', hint: 'Accounts and shipper copies' },
  { type: 'proforma-invoice', label: 'Proforma invoice', hint: 'Items, HSN codes and values' },
  { type: 'non-dg-invoice', label: 'Non-DG invoice', hint: 'Non-hazardous cargo certificate' },
  { type: 'box-invoice', label: 'Box labels', hint: 'One A5 label per box' },
  { type: 'kyc', label: 'KYC documents', hint: 'Uploaded shipper ID files' },
]
const ALL: Doc = { type: 'all', label: 'All documents', hint: 'All five above in one PDF' }

type Action = 'preview' | 'download'

function errorMessage(err: unknown) {
  if (err instanceof ApiRequestError && err.status === 502) {
    return "Couldn't prepare the document, please try again."
  }
  return getApiErrorMessage(err, "Couldn't prepare the document, please try again.")
}

/**
 * Rows of documents with Preview / Download. PDFs are generated fresh on each
 * click; `fetchLink` is the customer or admin endpoint, and the signed link it
 * returns expires, so it's never cached.
 */
function DocumentList({ fetchLink, compact = false }: { fetchLink: FetchLink; compact?: boolean }) {
  const [busy, setBusy] = useState<{ type: DocumentType; action: Action } | null>(null)

  const run = async (doc: Doc, action: Action) => {
    // Open the tab inside the click, before awaiting, or popup blockers stop it;
    // it shows a loader until the link arrives.
    const tab = action === 'preview' ? openPendingTab(doc.label.toLowerCase()) : null
    setBusy({ type: doc.type, action })
    try {
      const link = await fetchLink(doc.type, action === 'download')
      if (action === 'download') {
        // The link is served as an attachment, so this saves rather than navigates.
        window.location.assign(link.url)
      } else if (tab) {
        tab.go(link.url)
      } else if (!window.open(link.url, '_blank', 'noopener')) {
        toast.error('Allow pop-ups for this site to preview documents, or use Download.')
      }
    } catch (err) {
      tab?.close()
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const row = (doc: Doc, highlight = false) => {
    const isBusy = (action: Action) => busy?.type === doc.type && busy.action === action
    const Icon = highlight ? FileStack : FileText
    const button = (action: Action) => (
      <Button
        type="button"
        variant={action === 'download' && highlight ? 'default' : 'outline'}
        size="sm"
        className={cn(compact && 'h-8 px-2.5 text-xs')}
        loading={isBusy(action)}
        disabled={busy !== null && !isBusy(action)}
        onClick={() => run(doc, action)}
        aria-label={`${action === 'preview' ? 'Preview' : 'Download'} ${doc.label.toLowerCase()}`}
      >
        {action === 'preview' ? <Eye className="size-4" /> : <Download className="size-4" />}
        {action === 'preview' ? (compact ? 'View' : 'Preview') : 'Download'}
      </Button>
    )

    return (
      <li
        key={doc.type}
        className={cn(
          compact
            ? 'flex items-center justify-between gap-3 px-3 py-2'
            : 'flex flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between',
          highlight && 'bg-primary/5',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Icon
            className={cn(
              'shrink-0',
              compact ? 'size-4' : 'size-5',
              highlight ? 'text-primary' : 'text-[#8291a8]',
            )}
          />
          <div className="min-w-0">
            <p className={cn('text-sm', highlight ? 'font-semibold' : 'font-medium')}>
              {doc.label}
            </p>
            {!compact && <p className="text-xs text-muted-foreground">{doc.hint}</p>}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {button('preview')}
          {button('download')}
        </div>
      </li>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {DOCUMENTS.map((d) => row(d))}
      {row(ALL, true)}
    </ul>
  )
}

/** Documents section on a BOOKED booking's detail page. */
export function BookingDocumentsCard({ fetchLink }: { fetchLink: FetchLink }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          Generated from the booking&apos;s current details. KYC and All documents can take a few
          seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="border-t border-border p-0">
        <DocumentList fetchLink={fetchLink} />
      </CardContent>
    </Card>
  )
}

/**
 * Documents for one booking from a list row: a button that opens the
 * document rows in an overlay. Clicks stay inside, so a clickable row
 * doesn't navigate.
 */
export function BookingDocumentsPopover({
  fetchLink,
  bookingNumber,
}: {
  fetchLink: FetchLink
  bookingNumber: string
}) {
  return (
    // Portaled content still bubbles React events up to the row.
    <div onClick={(e) => e.stopPropagation()} className="inline-flex">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 px-2.5 text-xs"
            aria-label={`Documents for ${bookingNumber}`}
          >
            <FileText className="size-3.5" /> Documents
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[340px] max-w-[calc(100vw-32px)] p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-sm font-semibold">Documents</p>
            <p className="text-xs text-muted-foreground">{bookingNumber}</p>
          </div>
          <DocumentList fetchLink={fetchLink} compact />
        </PopoverContent>
      </Popover>
    </div>
  )
}
