import { useEffect, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { useAdminBookings, useLookupCountries, useLookupProviders } from '@/admin/hooks'
import { useUrlFilters } from '@/admin/useUrlFilters'
import { DateRange, SearchBox } from '@/admin/components/ListControls'
import { AdminBookingsTable } from '@/admin/components/bookings/AdminBookingsTable'
import type { ListAdminBookingsParams } from '@/admin/api'
import {
  BOOKING_STATUSES,
  SHIPMENT_TYPES,
  SHIPMENT_TYPE_LABELS,
  type BookingStatus,
  type ShipmentType,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE = 20
const ALL = 'all'

const SORTS: Record<
  string,
  { label: string; sortBy: ListAdminBookingsParams['sortBy']; sortOrder: 'asc' | 'desc' }
> = {
  newest: { label: 'Newest first', sortBy: 'createdAt', sortOrder: 'desc' },
  oldest: { label: 'Oldest first', sortBy: 'createdAt', sortOrder: 'asc' },
  shipSoon: { label: 'Ship date (soonest)', sortBy: 'shipmentDate', sortOrder: 'asc' },
  shipLate: { label: 'Ship date (latest)', sortBy: 'shipmentDate', sortOrder: 'desc' },
  priceHigh: { label: 'Price (high to low)', sortBy: 'price', sortOrder: 'desc' },
  priceLow: { label: 'Price (low to high)', sortBy: 'price', sortOrder: 'asc' },
}

const ADVANCED_KEYS = [
  'provider',
  'type',
  'dest',
  'shipFrom',
  'shipTo',
  'createdFrom',
  'createdTo',
  'minPrice',
  'maxPrice',
]

/** Min/max price inputs commit on blur or Enter, not on every keystroke. */
function PriceInput({
  label,
  value,
  onCommit,
}: {
  label: string
  value: string
  onCommit: (v: string) => void
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <Input
      type="number"
      inputMode="decimal"
      min="0"
      aria-label={label}
      placeholder={label}
      className="h-10"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onCommit(draft)}
      onKeyDown={(e) => e.key === 'Enter' && onCommit(draft)}
    />
  )
}

export default function AdminBookingsPage() {
  const f = useUrlFilters()
  const providers = useLookupProviders()
  const countries = useLookupCountries()

  const statusParam = f.get('status') as BookingStatus
  const status = BOOKING_STATUSES.includes(statusParam) ? statusParam : undefined
  const typeParam = f.get('type') as ShipmentType
  const shipmentType = SHIPMENT_TYPES.includes(typeParam) ? typeParam : undefined
  const sortKey = f.get('sort') in SORTS ? f.get('sort') : 'newest'
  const advancedCount = ADVANCED_KEYS.filter((k) => f.get(k)).length
  const [showAdvanced, setShowAdvanced] = useState(advancedCount > 0)

  const params: ListAdminBookingsParams = {
    page: f.page,
    limit: PAGE_SIZE,
    search: f.get('q') || undefined,
    status,
    courierProviderId: f.get('provider') || undefined,
    shipmentType,
    destinationCountry: f.get('dest') || undefined,
    shipmentDateFrom: f.date('shipFrom'),
    shipmentDateTo: f.date('shipTo'),
    createdFrom: f.date('createdFrom'),
    createdTo: f.date('createdTo'),
    minPrice: f.num('minPrice'),
    maxPrice: f.num('maxPrice'),
    sortBy: SORTS[sortKey].sortBy,
    sortOrder: SORTS[sortKey].sortOrder,
  }
  const { data, isLoading, isError } = useAdminBookings(params)
  const filtered = !!params.search || !!status || advancedCount > 0

  const clearAdvanced = () => f.set(Object.fromEntries(ADVANCED_KEYS.map((k) => [k, null])))

  const toolbar = (
    <div className="space-y-3 border-b border-border p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchBox
          value={f.get('q')}
          onCommit={(q) => f.set({ q }, { replace: true })}
          placeholder="Booking no., reference, customer, shipper or consignee"
          label="Search bookings"
          className="lg:w-[26rem]"
        />
        <div
          className="inline-flex w-fit flex-wrap gap-1 rounded-[10px] border border-border bg-card p-1"
          role="group"
          aria-label="Filter by status"
        >
          {[ALL, ...BOOKING_STATUSES].map((s) => {
            const active = (s === ALL && !status) || s === status
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => f.set({ status: s === ALL ? null : s })}
                className={cn(
                  'rounded-[8px] px-3 py-1 text-sm font-medium transition-colors duration-150',
                  active
                    ? 'bg-[#eff6ff] text-[#21649c]'
                    : 'text-muted-foreground hover:bg-[#f8fafc] hover:text-foreground',
                )}
              >
                {s === ALL ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2 lg:ml-auto">
          <Select value={sortKey} onValueChange={(v) => f.set({ sort: v === 'newest' ? null : v })}>
            <SelectTrigger className="h-10 w-48" aria-label="Sort bookings">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORTS).map(([k, s]) => (
                <SelectItem key={k} value={k}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-10"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <SlidersHorizontal className="size-4" />
            Filters{advancedCount > 0 && ` (${advancedCount})`}
          </Button>
        </div>
      </div>

      {showAdvanced && (
        <div className="grid gap-3 rounded-[10px] bg-[#f8fafc] p-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Courier</p>
            <Select
              value={f.get('provider') || ALL}
              onValueChange={(v) => f.set({ provider: v === ALL ? null : v })}
            >
              <SelectTrigger className="h-10 bg-card" aria-label="Courier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All couriers</SelectItem>
                {(providers.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.status === 'INACTIVE' && ' (inactive)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Shipment type</p>
            <Select
              value={shipmentType ?? ALL}
              onValueChange={(v) => f.set({ type: v === ALL ? null : v })}
            >
              <SelectTrigger className="h-10 bg-card" aria-label="Shipment type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All types</SelectItem>
                {SHIPMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {SHIPMENT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Destination</p>
            <Select
              value={f.get('dest') || ALL}
              onValueChange={(v) => f.set({ dest: v === ALL ? null : v })}
            >
              <SelectTrigger className="h-10 bg-card" aria-label="Destination">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All destinations</SelectItem>
                {(countries.data ?? []).map((c) => (
                  <SelectItem key={c.alpha2} value={c.alpha2}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-medium text-muted-foreground">Price (₹)</legend>
            <div className="flex items-center gap-2">
              <PriceInput
                label="Min"
                value={f.get('minPrice')}
                onCommit={(v) => f.set({ minPrice: v })}
              />
              <span className="text-xs text-muted-foreground">to</span>
              <PriceInput
                label="Max"
                value={f.get('maxPrice')}
                onCommit={(v) => f.set({ maxPrice: v })}
              />
            </div>
          </fieldset>
          <DateRange
            label="Shipment date"
            idPrefix="ship"
            from={f.get('shipFrom')}
            to={f.get('shipTo')}
            onChange={(from, to) => f.set({ shipFrom: from, shipTo: to })}
          />
          <DateRange
            label="Created"
            idPrefix="created"
            from={f.get('createdFrom')}
            to={f.get('createdTo')}
            onChange={(from, to) => f.set({ createdFrom: from, createdTo: to })}
          />
          {advancedCount > 0 && (
            <div className="flex items-end">
              <Button variant="ghost" className="h-10" onClick={clearAdvanced}>
                <X className="size-4" /> Clear filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Every customer's bookings." />
      <AdminBookingsTable
        items={data?.items ?? []}
        pagination={data?.pagination}
        page={f.page}
        onPage={(p) => f.set({ page: String(p) })}
        isLoading={isLoading}
        isError={isError}
        filtered={filtered}
        toolbar={toolbar}
      />
    </div>
  )
}
