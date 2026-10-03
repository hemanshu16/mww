import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, History } from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { useActivityLogs } from '@/admin/hooks'
import { Pager } from '@/admin/components/ListControls'
import { ENTITY_LABELS, ENTITY_PAGES } from '@/admin/components/activity/activityMeta'
import type { ActivityLogEntry, AuditEntityType } from '@/admin/types'
import { formatDateTime, kycFileName } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Pagination } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (Array.isArray(v)) return v.length ? v.map(formatValue).join(', ') : '(none)'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'object') return JSON.stringify(v)
  // KYC storage paths: the file name is what matters.
  if (typeof v === 'string' && v.startsWith('kyc/')) return kycFileName(v)
  return String(v)
}

/** Field names that don't read well split on camelCase. */
const FIELD_LABELS: Record<string, string> = {
  hsnCode: 'HSN code',
  uom: 'UOM',
  igst: 'IGST',
  boxNumber: 'Box',
  kyc1Type: 'KYC 1 type',
  kyc1Number: 'KYC 1 number',
  kyc1DocFront: 'KYC 1 front',
  kyc1DocBack: 'KYC 1 back',
  kyc2Type: 'KYC 2 type',
  kyc2Number: 'KYC 2 number',
  kyc2Doc: 'KYC 2 document',
  path: 'Document',
}

/** "shipper.city" → "Shipper city", "isActive" → "Is active", "items[2].igst" → "Item 2 · IGST". */
function fieldLabel(key: string): string {
  const item = /^items\[(\d+)\]\.(\w+)$/.exec(key)
  if (item) return `Item ${item[1]} · ${fieldLabel(item[2])}`
  const words = key
    .split('.')
    .map((part) => FIELD_LABELS[part] ?? part.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase())
    .join(' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** A whole item line in an `items[N]` diff (added or removed). */
type ItemSnapshot = Record<string, unknown> & { name?: string; quantity?: number; price?: number }

function ItemValue({ item }: { item: ItemSnapshot }) {
  const rest = Object.entries(item).filter(([k]) => !['name', 'quantity', 'price'].includes(k))
  return (
    <details>
      <summary className="cursor-pointer">
        {item.name ?? 'Item'} · {item.quantity ?? '—'} × {item.price ?? '—'}
      </summary>
      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs font-normal text-muted-foreground">
        {rest.map(([k, v]) => (
          <div key={k} className="contents">
            <dt>{fieldLabel(k)}</dt>
            <dd className="text-foreground">{formatValue(v)}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

function ChangeRow({ field, from, to }: { field: string; from: unknown; to: unknown }) {
  const line = /^items\[(\d+)\]$/.exec(field)
  if (line) {
    const added = from == null
    const item = (added ? to : from) as ItemSnapshot
    return (
      <tr>
        <td className="px-3 py-2 text-muted-foreground">
          Item {line[1]} {added ? 'added' : 'removed'}
        </td>
        <td className="px-3 py-2 text-[#b91c1c]">{added ? '—' : <ItemValue item={item} />}</td>
        <td className="px-3 py-2 font-medium text-[#047857]">
          {added ? <ItemValue item={item} /> : '—'}
        </td>
      </tr>
    )
  }
  return (
    <tr>
      <td className="px-3 py-2 text-muted-foreground">{fieldLabel(field)}</td>
      <td className="px-3 py-2 text-[#b91c1c] line-through decoration-[#fca5a5]">
        {formatValue(from)}
      </td>
      <td className="px-3 py-2 font-medium text-[#047857]">{formatValue(to)}</td>
    </tr>
  )
}

function Entry({ entry, showRecord }: { entry: ActivityLogEntry; showRecord: boolean }) {
  const { can } = useStaffAuth()
  const [open, setOpen] = useState(false)
  const changes = entry.changes ? Object.entries(entry.changes) : []
  const page = ENTITY_PAGES[entry.entityType]
  // Deleted records have no page left to open.
  const deleted = entry.action.endsWith('.delete')
  const href = page && !deleted && can(page.perm) ? page.href(entry.entityId) : null

  return (
    <li className="px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground">{entry.summary}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span className="font-medium text-[#526581]">{entry.actor?.name ?? 'System'}</span>
            <span>·</span>
            <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
            <span>·</span>
            <code className="text-[11px]">{entry.action}</code>
            {showRecord && (
              <>
                <span>·</span>
                {href ? (
                  <Link
                    to={href}
                    className="inline-flex items-center gap-0.5 text-primary hover:underline"
                  >
                    {ENTITY_LABELS[entry.entityType]} <ArrowRight className="size-3" />
                  </Link>
                ) : (
                  <span>{ENTITY_LABELS[entry.entityType]}</span>
                )}
              </>
            )}
          </p>
        </div>
        {changes.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex shrink-0 items-center gap-1 self-start text-xs font-medium text-primary hover:underline"
          >
            {changes.length} change{changes.length === 1 ? '' : 's'}
            <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>
      {open && changes.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-[10px] border border-border">
          <table className="w-full text-[13px]">
            <thead className="bg-[#f8fafc] text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Field</th>
                <th className="px-3 py-2 font-medium">From</th>
                <th className="px-3 py-2 font-medium">To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {changes.map(([key, c]) => (
                <ChangeRow key={key} field={key} from={c.from} to={c.to} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </li>
  )
}

export function ActivityList({
  items,
  pagination,
  page,
  onPage,
  isLoading,
  isError,
  showRecord = true,
  emptyText = 'No activity yet.',
}: {
  items: ActivityLogEntry[]
  pagination?: Pagination
  page: number
  onPage: (page: number) => void
  isLoading: boolean
  isError: boolean
  /** Link each entry to its record (off on a record's own History tab). */
  showRecord?: boolean
  emptyText?: string
}) {
  return (
    <Card className="overflow-hidden">
      {isLoading ? (
        <ul className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="space-y-2 px-5 py-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </li>
          ))}
        </ul>
      ) : isError ? (
        <p className="py-12 text-center text-sm text-destructive">
          Couldn&apos;t load activity. Please try again.
        </p>
      ) : items.length === 0 ? (
        <EmptyState icon={History} title={emptyText} />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((e) => (
            <Entry key={e.id} entry={e} showRecord={showRecord} />
          ))}
        </ul>
      )}
      <Pager pagination={pagination} page={page} onPage={onPage} />
    </Card>
  )
}

/** A single record's history (customer or booking pages). */
export function ActivityHistory({
  entityType,
  entityId,
}: {
  entityType: AuditEntityType
  entityId: string
}) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useActivityLogs({ entityType, entityId, page, limit: 20 })
  return (
    <ActivityList
      items={data?.items ?? []}
      pagination={data?.pagination}
      page={page}
      onPage={setPage}
      isLoading={isLoading}
      isError={isError}
      showRecord={false}
      emptyText="No changes recorded yet."
    />
  )
}
