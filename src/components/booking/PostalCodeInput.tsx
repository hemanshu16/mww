import { useId, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Highlight } from '@/components/booking/Highlight'
import { POSTAL_MIN_CHARS, usePostalSearch } from '@/hooks/usePostalSearch'
import { ApiRequestError } from '@/lib/api/client'
import { POSTAL_RESULT_LIMIT, type PostalPlace } from '@/lib/api/postal'
import { cn } from '@/lib/utils'

/**
 * Zip-code field with suggestions: type a city or part of a code and pick a
 * match. Typing a code directly is still allowed.
 */
export function PostalCodeInput({
  id,
  countryCode,
  countryName,
  value,
  onChange,
  onPlaceChange,
  'aria-invalid': invalid,
  'aria-describedby': describedBy,
  onBlur,
}: {
  id?: string
  countryCode: string
  countryName: string
  value: string
  onChange: (zip: string) => void
  onPlaceChange: (place: PostalPlace | null) => void
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  onBlur?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const search = usePostalSearch(countryCode, value, open)
  const results = (search.data ?? []).slice(0, POSTAL_RESULT_LIMIT)
  const typed = value.trim()

  const pick = (p: PostalPlace) => {
    onChange(p.postalCode)
    onPlaceChange(p)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return setOpen(true)
      const next = Math.min(results.length - 1, Math.max(0, active + (e.key === 'ArrowDown' ? 1 : -1)))
      setActive(next)
      listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter' && open && results[active]) {
      e.preventDefault()
      pick(results[active])
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
    }
  }

  let body: React.ReactNode
  if (typed.length < POSTAL_MIN_CHARS) {
    body = <Hint>Type at least {POSTAL_MIN_CHARS} characters of a city or zip code.</Hint>
  } else if (search.isError) {
    const rateLimited = search.error instanceof ApiRequestError && search.error.status === 429
    body = (
      <Hint>
        {rateLimited
          ? 'Too many searches. Wait a minute, or type the zip code yourself.'
          : 'Zip lookup isn’t available right now. You can still type the zip code.'}
      </Hint>
    )
  } else if (search.pending && results.length === 0) {
    body = (
      <div className="space-y-1 p-1" aria-busy>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex h-12 items-center gap-3 px-2.5">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    )
  } else if (results.length === 0) {
    body = (
      <Hint>
        No places match &ldquo;{typed}&rdquo; in {countryName}. Check the spelling, or type the zip code
        yourself.
      </Hint>
    )
  } else {
    body = (
      <div ref={listRef} id={listId} role="listbox" className="max-h-72 overflow-y-auto p-1">
        {results.map((p, i) => (
          <div
            key={`${p.postalCode}-${p.placeName}-${i}`}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={p.postalCode === value}
            data-index={i}
            onMouseMove={() => setActive(i)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(p)}
            className={cn(
              'flex min-h-12 cursor-pointer items-center gap-3 rounded-[8px] px-2.5 py-1.5',
              i === active && 'bg-[#f6f9fd]',
            )}
          >
            <span className="w-16 shrink-0 text-sm font-semibold tabular-nums text-foreground">
              <Highlight text={p.postalCode} query={typed} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-[#526581]">
                <Highlight text={p.placeName} query={typed} />
              </span>
              {p.admin1 && <span className="block truncate text-xs text-[#8291a8]">{p.admin1}</span>}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8291a8]" />
          <input
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            autoComplete="off"
            spellCheck={false}
            value={value}
            placeholder="City or zip code"
            onChange={(e) => {
              onChange(e.target.value)
              onPlaceChange(null)
              setActive(0)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setOpen(false)
              onBlur?.()
            }}
            onKeyDown={onKeyDown}
            className="flex h-11 w-full rounded-[8px] border border-input bg-card pl-9 pr-9 text-sm text-foreground transition-[color,box-shadow,border-color] placeholder:text-[#9aa8ba] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/10 aria-[invalid=true]:border-destructive"
          />
          {search.pending && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#8291a8]" />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Clicking back into the input shouldn't close and reopen the list.
          if ((e.target as HTMLElement)?.id === id) e.preventDefault()
        }}
      >
        {body}
      </PopoverContent>
    </Popover>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-4 text-[13px] leading-5 text-muted-foreground">{children}</p>
}
