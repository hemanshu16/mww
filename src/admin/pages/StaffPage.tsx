import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { useStaffList } from '@/admin/hooks'
import { AddStaffDialog } from '@/admin/components/staff/AddStaffDialog'
import { EditStaffDialog } from '@/admin/components/staff/EditStaffDialog'
import { ResetPasswordDialog } from '@/admin/components/staff/ResetPasswordDialog'
import type { Staff } from '@/admin/types'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const PAGE_SIZE = 20
const COLUMNS = 4

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  )
}

export default function StaffPage() {
  const { can, profile: me } = useStaffAuth()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const statusParam = params.get('status')
  const status = statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all'
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)

  // Debounce the search box before it hits the URL and the API.
  const [draft, setDraft] = useState(q)
  useEffect(() => setDraft(q), [q])

  const setParam = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!value) next.delete(key)
        else next.set(key, value)
        if (key !== 'page') next.delete('page')
        return next
      },
      { replace: key === 'q' },
    )

  useEffect(() => {
    if (draft.trim() === q) return
    const t = setTimeout(() => setParam('q', draft.trim() || null), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  const { data, isLoading, isError } = useStaffList({
    page,
    limit: PAGE_SIZE,
    search: q || undefined,
    isActive: status === 'all' ? undefined : status === 'active',
  })
  const items = data?.items ?? []
  const pagination = data?.pagination
  const filtered = !!q || status !== 'all'

  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [resetting, setResetting] = useState<Staff | null>(null)

  const canUpdate = can('staff.update')
  // Super admin rows are read-only for everyone else.
  const rowActionsAllowed = (s: Staff) => canUpdate && (!s.isSuperAdmin || !!me?.isSuperAdmin)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Everyone who can sign in to the staff console, and what they can do."
        actions={
          can('staff.create') && (
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" /> Add staff
            </Button>
          )
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
          <div className="relative md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8291a8]" />
            <input
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search by name or email"
              aria-label="Search staff"
              className="h-10 w-full rounded-[8px] border border-border bg-[#f8fafc] pl-9 pr-9 text-sm text-foreground placeholder:text-[#9aa8ba] focus:border-primary focus:bg-card focus:outline-none focus:ring-[3px] focus:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
            />
            {draft && (
              <button
                type="button"
                onClick={() => {
                  setDraft('')
                  setParam('q', null)
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-[#8291a8] hover:bg-[#eef2f8] hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div
            className="inline-flex w-fit gap-1 rounded-[10px] border border-border bg-card p-1 md:ml-auto"
            role="group"
            aria-label="Filter by status"
          >
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={status === tab.value}
                onClick={() => setParam('status', tab.value === 'all' ? null : tab.value)}
                className={cn(
                  'rounded-[8px] px-3 py-1 text-sm font-medium transition-colors duration-150',
                  status === tab.value
                    ? 'bg-[#eff6ff] text-[#21649c]'
                    : 'text-muted-foreground hover:bg-[#f8fafc] hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Staff member</TableHead>
              <TableHead className="hidden md:table-cell">Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-14">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: COLUMNS }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-[160px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={COLUMNS} className="py-12 text-center text-sm text-destructive">
                  Couldn&apos;t load staff. Please try again.
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={COLUMNS} className="p-0">
                  <EmptyState
                    icon={Users}
                    title={filtered ? 'No staff match these filters' : 'No staff yet'}
                    description={
                      filtered
                        ? 'Try a different name, email or status.'
                        : 'Add the first team member.'
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((s) => {
                const isSelf = s.id === me?.id
                const actions = rowActionsAllowed(s)
                return (
                  <TableRow key={s.id} className={cn(!s.isActive && 'bg-[#fbfcfe]')}>
                    <TableCell>
                      <div
                        className={cn(
                          'flex min-w-0 items-center gap-3',
                          !s.isActive && 'opacity-60',
                        )}
                      >
                        <Avatar className="size-9">
                          <AvatarFallback>{initials(s.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-foreground">
                              {s.name}
                            </span>
                            {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                            {s.isSuperAdmin && <Badge variant="gold">Super admin</Badge>}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {s.roles.length === 0 ? (
                          <span className="text-sm text-[#aab5c4]">No roles</span>
                        ) : (
                          s.roles.map((r) => (
                            <Badge key={r.id} variant="booked">
                              {r.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? 'success' : 'draft'}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {actions && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={`Actions for ${s.name}`}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditing(s)}>
                              <Pencil className="size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setResetting(s)}>
                              <KeyRound className="size-4" /> Reset password
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setParam('page', String(page - 1))}
              >
                <ChevronLeft className="size-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setParam('page', String(page + 1))}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AddStaffDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditStaffDialog staff={editing} onOpenChange={(o) => !o && setEditing(null)} />
      <ResetPasswordDialog staff={resetting} onOpenChange={(o) => !o && setResetting(null)} />
    </div>
  )
}
