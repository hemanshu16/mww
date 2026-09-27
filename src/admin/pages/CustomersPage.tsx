import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { useCustomers } from '@/admin/hooks'
import { useUrlFilters } from '@/admin/useUrlFilters'
import { DateRange, FilterChip, Pager, SearchBox } from '@/admin/components/ListControls'
import type { ListCustomersParams } from '@/admin/api'
import { formatDate, formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE = 20
const COLUMNS = 8

const SORTS: Record<
  string,
  { label: string; sortBy: ListCustomersParams['sortBy']; sortOrder: 'asc' | 'desc' }
> = {
  newest: { label: 'Newest first', sortBy: 'createdAt', sortOrder: 'desc' },
  oldest: { label: 'Oldest first', sortBy: 'createdAt', sortOrder: 'asc' },
  name: { label: 'Name A–Z', sortBy: 'name', sortOrder: 'asc' },
  debtors: { label: 'Biggest debtors', sortBy: 'balance', sortOrder: 'asc' },
}

export default function CustomersPage() {
  const navigate = useNavigate()
  const f = useUrlFilters()
  const sortKey = f.get('sort') in SORTS ? f.get('sort') : 'newest'
  const showInactive = f.get('inactive') === '1'
  const verified = f.bool('verified')

  const params: ListCustomersParams = {
    page: f.page,
    limit: PAGE_SIZE,
    search: f.get('q') || undefined,
    // Active only unless "Show inactive" is on, which shows both.
    isActive: showInactive ? undefined : true,
    isEmailVerified: verified,
    isGstBilling: f.get('gst') === '1' ? true : undefined,
    hasOutstanding: f.get('owing') === '1' ? true : undefined,
    joinedFrom: f.date('joinedFrom'),
    joinedTo: f.date('joinedTo'),
    sortBy: SORTS[sortKey].sortBy,
    sortOrder: SORTS[sortKey].sortOrder,
  }
  const { data, isLoading, isError } = useCustomers(params)
  const items = data?.items ?? []
  const filtered =
    !!params.search ||
    showInactive ||
    verified !== undefined ||
    !!params.isGstBilling ||
    !!params.hasOutstanding ||
    !!params.joinedFrom ||
    !!params.joinedTo

  const toggle = (key: string) => f.set({ [key]: f.get(key) === '1' ? null : '1' })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Every registered customer, with their wallet and bookings."
      />

      <Card className="overflow-hidden">
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <SearchBox
              value={f.get('q')}
              onCommit={(q) => f.set({ q }, { replace: true })}
              placeholder="Search name, company, email or phone"
              label="Search customers"
              className="md:w-96"
            />
            <div className="md:ml-auto md:w-48">
              <Select
                value={sortKey}
                onValueChange={(v) => f.set({ sort: v === 'newest' ? null : v })}
              >
                <SelectTrigger className="h-10" aria-label="Sort customers">
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
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <FilterChip active={f.get('owing') === '1'} onClick={() => toggle('owing')}>
                Outstanding
              </FilterChip>
              <FilterChip
                active={verified === true}
                onClick={() => f.set({ verified: verified === true ? null : 'true' })}
              >
                Verified
              </FilterChip>
              <FilterChip
                active={verified === false}
                onClick={() => f.set({ verified: verified === false ? null : 'false' })}
              >
                Unverified
              </FilterChip>
              <FilterChip active={f.get('gst') === '1'} onClick={() => toggle('gst')}>
                GST billing
              </FilterChip>
              <FilterChip active={showInactive} onClick={() => toggle('inactive')}>
                Show inactive
              </FilterChip>
            </div>
            <div className="lg:w-80">
              <DateRange
                label="Joined"
                idPrefix="joined"
                from={f.get('joinedFrom')}
                to={f.get('joinedTo')}
                onChange={(from, to) => f.set({ joinedFrom: from, joinedTo: to })}
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Customer</TableHead>
              <TableHead className="hidden xl:table-cell">Phone</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="hidden text-right md:table-cell">Outstanding</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Credit limit</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Bookings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: COLUMNS }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={COLUMNS} className="py-12 text-center text-sm text-destructive">
                  Couldn&apos;t load customers. Please try again.
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={COLUMNS} className="p-0">
                  <EmptyState
                    icon={Users}
                    title={filtered ? 'No customers match these filters' : 'No customers yet'}
                    description={
                      filtered
                        ? 'Try other words or remove a filter. Every word must match.'
                        : 'Customers appear here once they register.'
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => (
                <TableRow
                  key={c.id}
                  className={cn('cursor-pointer', !c.isActive && 'bg-[#fbfcfe]')}
                  onClick={() => navigate(`/admin/customers/${c.id}`)}
                >
                  <TableCell>
                    <div className={cn('min-w-0', !c.isActive && 'opacity-60')}>
                      <p className="truncate text-sm font-medium text-foreground">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.companyName} · {c.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                    {c.phoneNumber}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium tabular-nums',
                      c.wallet.balance < 0 && 'text-[#b91c1c]',
                    )}
                  >
                    {formatINR(c.wallet.balance)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {c.wallet.outstandingAmount > 0 ? (
                      <span className="text-[#b45309]">
                        {formatINR(c.wallet.outstandingAmount)}
                      </span>
                    ) : (
                      <span className="text-[#aab5c4]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground lg:table-cell">
                    {formatINR(c.wallet.creditLimit)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {c.bookings.total}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={c.isActive ? 'success' : 'draft'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {!c.isEmailVerified && <Badge variant="gold">Unverified</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {formatDate(c.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pager
          pagination={data?.pagination}
          page={f.page}
          onPage={(p) => f.set({ page: String(p) })}
        />
      </Card>
    </div>
  )
}
