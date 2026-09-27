import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Pagination } from '@/lib/types'

/** Search input that commits after the user stops typing. */
export function SearchBox({
  value,
  onCommit,
  placeholder,
  label,
  className,
}: {
  value: string
  onCommit: (value: string) => void
  placeholder: string
  label: string
  className?: string
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  useEffect(() => {
    if (draft.trim() === value) return
    const t = setTimeout(() => onCommit(draft.trim()), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8291a8]" />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 w-full rounded-[8px] border border-border bg-[#f8fafc] pl-9 pr-9 text-sm text-foreground placeholder:text-[#9aa8ba] focus:border-primary focus:bg-card focus:outline-none focus:ring-[3px] focus:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft('')
            onCommit('')
          }}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-[#8291a8] hover:bg-[#eef2f8] hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/** Toggleable filter pill. */
export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors',
        active
          ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#21649c]'
          : 'border-border bg-card text-muted-foreground hover:bg-[#f8fafc] hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

/** Prev / next footer for paginated tables. */
export function Pager({
  pagination,
  page,
  onPage,
}: {
  pagination?: Pagination
  page: number
  onPage: (page: number) => void
}) {
  if (!pagination || pagination.totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pagination.totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

/** Labelled From–To date pair. */
export function DateRange({
  label,
  from,
  to,
  onChange,
  idPrefix,
}: {
  label: string
  from: string
  to: string
  onChange: (from: string, to: string) => void
  idPrefix: string
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-xs font-medium text-muted-foreground">{label}</legend>
      <div className="flex items-center gap-2">
        <input
          id={`${idPrefix}-from`}
          type="date"
          aria-label={`${label} from`}
          value={from}
          max={to || undefined}
          onChange={(e) => onChange(e.target.value, to)}
          className="h-10 w-full min-w-0 rounded-[8px] border border-input bg-card px-2 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/10"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <input
          id={`${idPrefix}-to`}
          type="date"
          aria-label={`${label} to`}
          value={to}
          min={from || undefined}
          onChange={(e) => onChange(from, e.target.value)}
          className="h-10 w-full min-w-0 rounded-[8px] border border-input bg-card px-2 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/10"
        />
      </div>
    </fieldset>
  )
}
