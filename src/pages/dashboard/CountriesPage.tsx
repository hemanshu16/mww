import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowDownAZ,
  ArrowUpZA,
  ChevronLeft,
  ChevronRight,
  Earth,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCountries, useUpdateCountry } from '@/hooks/useCountries'
import { getApiErrorMessage } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CountryFlag } from '@/components/countries/CountryFlag'
import { CountryFormDialog } from '@/components/countries/CountryFormDialog'
import { DeleteCountryDialog } from '@/components/countries/DeleteCountryDialog'
import { NO_REGION, RegionCoverage } from '@/components/countries/RegionCoverage'
import { cn } from '@/lib/utils'
import type { Country } from '@/lib/types'

const PAGE_SIZE = 25
const COLUMNS = 6

type Visibility = 'all' | 'shown' | 'hidden'
const VISIBILITY_TABS: { value: Visibility; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'shown', label: 'Shown' },
  { value: 'hidden', label: 'Hidden' },
]

/** Same rule as the API's `search`: part of the name, or an exact ISO code. */
function matchesSearch(c: Country, q: string) {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  return (
    c.name.toLowerCase().includes(needle) ||
    c.alpha2.toLowerCase() === needle ||
    c.alpha3.toLowerCase() === needle
  )
}

function VisibilitySwitch({ country }: { country: Country }) {
  const update = useUpdateCountry()
  return (
    <Switch
      checked={country.isVisible}
      aria-label={`Show ${country.name} to customers`}
      onCheckedChange={(isVisible) =>
        update.mutate(
          { id: country.id, input: { isVisible } },
          {
            onSuccess: () =>
              toast.success(
                isVisible ? `${country.name} is now shown to customers.` : `${country.name} is now hidden.`,
              ),
            onError: (error) => toast.error(getApiErrorMessage(error, 'Could not change visibility.')),
          },
        )
      }
    />
  )
}

export default function CountriesPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const region = params.get('region')
  const visParam = params.get('visibility')
  const visibility: Visibility = visParam === 'shown' || visParam === 'hidden' ? visParam : 'all'
  const sortDesc = params.get('sort') === 'desc'
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)

  const { data: countries = [], isLoading, isError, error, refetch, isFetching } = useCountries()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Country | null>(null)
  const [deleting, setDeleting] = useState<Country | null>(null)

  const setParam = (key: string, value: string | null) => {
    // Functional form so rapid changes (typing right after clearing a filter) don't use stale params.
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === null || value === '') next.delete(key)
        else next.set(key, value)
        if (key !== 'page') next.delete('page')
        return next
      },
      { replace: key === 'q' },
    )
  }

  const regions = useMemo(
    () => [...new Set(countries.map((c) => c.region).filter((r): r is string => !!r))].sort(),
    [countries],
  )

  const filtered = useMemo(() => {
    const list = countries.filter(
      (c) =>
        matchesSearch(c, q) &&
        (!region || (c.region ?? NO_REGION) === region) &&
        (visibility === 'all' || c.isVisible === (visibility === 'shown')),
    )
    list.sort((a, b) => a.name.localeCompare(b.name))
    if (sortDesc) list.reverse()
    return list
  }, [countries, q, region, visibility, sortDesc])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasFilters = !!q || !!region || visibility !== 'all'

  const clearFilters = () => setParams(sortDesc ? { sort: 'desc' } : {})
  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (c: Country) => {
    setEditing(c)
    setFormOpen(true)
  }


  return (
    <div className="space-y-6">
      <PageHeader
        title="Countries"
        description="Choose which destinations customers can book, and how each one is priced."
        actions={
          <Button onClick={openCreate} disabled={isError}>
            <Plus className="size-4" />
            Add country
          </Button>
        }
      />

      {isLoading ? (
        <Card className="space-y-4 p-6">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-56" />
          </div>
          <Skeleton className="h-3 w-full" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </Card>
      ) : (
        countries.length > 0 && (
          <RegionCoverage
            countries={countries}
            activeRegion={region}
            onRegionChange={(r) => setParam('region', r)}
          />
        )
      )}

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
          <div className="relative md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8291a8]" />
            <input
              type="search"
              value={q}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder="Search by name or code"
              aria-label="Search countries"
              className="h-10 w-full rounded-[8px] border border-border bg-[#f8fafc] pl-9 pr-9 text-sm text-foreground placeholder:text-[#9aa8ba] focus:border-primary focus:bg-card focus:outline-none focus:ring-[3px] focus:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button
                type="button"
                onClick={() => setParam('q', null)}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-[#8291a8] hover:bg-[#eef2f8] hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 md:ml-auto">
            {region && (
              <button
                type="button"
                onClick={() => setParam('region', null)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#eff6ff] pl-3 pr-2 text-xs font-semibold text-[#21649c] hover:bg-[#dbeafe]"
              >
                {region === NO_REGION ? 'No region' : region}
                <X className="size-3.5" aria-label="Remove region filter" />
              </button>
            )}
            <div
              className="inline-flex gap-1 rounded-[10px] border border-border bg-card p-1"
              role="group"
              aria-label="Filter by visibility"
            >
              {VISIBILITY_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={visibility === tab.value}
                  onClick={() => setParam('visibility', tab.value === 'all' ? null : tab.value)}
                  className={cn(
                    'rounded-[8px] px-3 py-1 text-sm font-medium transition-colors duration-150',
                    visibility === tab.value
                      ? 'bg-[#eff6ff] text-[#21649c]'
                      : 'text-muted-foreground hover:bg-[#f8fafc] hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setParam('sort', sortDesc ? null : 'desc')}
              aria-label={sortDesc ? 'Sort A to Z' : 'Sort Z to A'}
            >
              {sortDesc ? <ArrowUpZA /> : <ArrowDownAZ />}
              {sortDesc ? 'Z–A' : 'A–Z'}
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Country</TableHead>
              <TableHead className="hidden sm:table-cell">Codes</TableHead>
              <TableHead className="hidden md:table-cell">Region</TableHead>
              <TableHead className="hidden lg:table-cell">Rates</TableHead>
              <TableHead className="w-24">Shown</TableHead>
              <TableHead className="w-14">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-8" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-10 rounded-full" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={COLUMNS} className="p-0">
                  <EmptyState
                    icon={Earth}
                    title="Countries didn't load"
                    description={getApiErrorMessage(error, 'Check your connection and try again.')}
                    action={
                      <Button variant="outline" onClick={() => refetch()} loading={isFetching}>
                        <RotateCw className="size-4" />
                        Try again
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={COLUMNS} className="p-0">
                  {hasFilters ? (
                    <EmptyState
                      icon={Search}
                      title={q ? `No countries match "${q}"` : 'No countries match these filters'}
                      description="Search by country name, or an exact code like IN or IND."
                      action={
                        <Button variant="outline" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={Earth}
                      title="No countries yet"
                      description="Add the first destination customers can ship to."
                      action={
                        <Button onClick={openCreate}>
                          <Plus className="size-4" />
                          Add country
                        </Button>
                      }
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => (
                <TableRow key={c.id} className={cn(!c.isVisible && 'bg-[#fbfcfe]')}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <CountryFlag
                        flagUrl={c.flagUrl}
                        alpha2={c.alpha2}
                        className={cn(!c.isVisible && 'opacity-50 grayscale')}
                      />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className={cn(
                            'block max-w-[220px] truncate text-left text-sm font-medium hover:underline focus-visible:underline focus-visible:outline-none',
                            c.isVisible ? 'text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {c.name}
                        </button>
                        {c.subregion && (
                          <span className="hidden max-w-[220px] truncate text-xs text-muted-foreground sm:block">
                            {c.subregion}
                          </span>
                        )}
                        {/* Codes column is hidden on phones; keep them next to the name. */}
                        <span className="block text-xs font-semibold tracking-[0.06em] text-[#526581] sm:hidden">
                          {c.alpha2} / {c.alpha3}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-[13px] font-semibold tabular-nums tracking-[0.06em] text-[#526581]">
                      {c.alpha2}
                      <span className="mx-1.5 font-normal text-[#aab5c4]">/</span>
                      {c.alpha3}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {c.region ?? <span className="text-[#aab5c4]">—</span>}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {c.isZipcodeLevelRates ? 'By zip code' : 'One country rate'}
                  </TableCell>
                  <TableCell>
                    <VisibilitySwitch country={c} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${c.name}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleting(c)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm tabular-nums text-muted-foreground">
              {filtered.length === countries.length
                ? `${countries.length} countries`
                : `${filtered.length} of ${countries.length} countries`}
              {totalPages > 1 &&
                `, showing${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)}`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setParam('page', String(currentPage - 1))}
                >
                  <ChevronLeft className="size-4" /> Prev
                </Button>
                <span className="px-1 text-sm tabular-nums text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setParam('page', String(currentPage + 1))}
                >
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <CountryFormDialog open={formOpen} onOpenChange={setFormOpen} country={editing} regions={regions} />
      <DeleteCountryDialog country={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </div>
  )
}
