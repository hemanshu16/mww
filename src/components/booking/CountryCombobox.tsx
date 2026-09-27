import { useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CountryFlag } from '@/components/countries/CountryFlag'
import { Highlight } from '@/components/booking/Highlight'
import { cn } from '@/lib/utils'
import type { Country } from '@/lib/types'

/**
 * Same match rule as the countries API (part of the name, or an exact ISO
 * code), ranked: exact code, then name prefix, then anywhere in the name.
 */
function rank(c: Country, n: string): number {
  if (c.alpha2.toLowerCase() === n || c.alpha3.toLowerCase() === n) return 0
  const name = c.name.toLowerCase()
  if (name.startsWith(n)) return 1
  return name.includes(n) ? 2 : -1
}

function search(countries: Country[], q: string): Country[] {
  const n = q.trim().toLowerCase()
  if (!n) return countries
  return countries
    .map((c) => ({ c, r: rank(c, n) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r)
    .map((x) => x.c)
}

/** Searchable destination picker. Value is the country's alpha-2 code. */
export function CountryCombobox({
  id,
  value,
  onChange,
  countries,
  loading,
  error,
  'aria-invalid': invalid,
  'aria-describedby': describedBy,
  onBlur,
}: {
  id?: string
  value: string
  onChange: (alpha2: string) => void
  countries: Country[]
  loading?: boolean
  error?: boolean
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  onBlur?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selected = countries.find((c) => c.alpha2 === value)
  const results = useMemo(() => search(countries, query), [countries, query])

  const openChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setQuery('')
      const idx = countries.findIndex((c) => c.alpha2 === value)
      setActive(Math.max(0, idx))
      requestAnimationFrame(() => scrollToIndex(Math.max(0, idx), 'center'))
    } else {
      onBlur?.()
    }
  }

  const scrollToIndex = (i: number, block: ScrollLogicalPosition = 'nearest') => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${i}"]`)?.scrollIntoView({ block })
  }

  const pick = (c: Country) => {
    onChange(c.alpha2)
    setOpen(false)
    onBlur?.()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(results.length - 1, Math.max(0, active + (e.key === 'ArrowDown' ? 1 : -1)))
      setActive(next)
      scrollToIndex(next)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[active]) pick(results[active])
    }
  }

  const placeholder = loading ? 'Loading countries…' : error ? 'Countries unavailable' : 'Select a country'

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={invalid}
            aria-describedby={describedBy}
          disabled={loading || error}
          className={cn(
            'flex h-11 w-full items-center gap-3 rounded-[8px] border border-input bg-card px-3 text-left text-sm transition-[color,box-shadow,border-color] focus:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive',
            open && 'border-primary ring-[3px] ring-primary/10',
          )}
        >
          {selected ? (
            <>
              <CountryFlag flagUrl={selected.flagUrl} alpha2={selected.alpha2} className="h-[18px] w-6" />
              <span className="min-w-0 flex-1 truncate text-foreground">{selected.name}</span>
              <span className="text-xs font-semibold tracking-[0.06em] text-[#8291a8]">{selected.alpha2}</span>
            </>
          ) : (
            <span className="flex-1 truncate text-[#9aa8ba]">{value || placeholder}</span>
          )}
          <ChevronDown className={cn('size-4 shrink-0 text-[#8291a8] transition-transform duration-150', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>

      <PopoverContent className="min-w-[280px] p-0" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-2 border-b border-[#edf1f6] px-3">
          <Search className="size-4 shrink-0 text-[#8291a8]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
              listRef.current?.scrollTo({ top: 0 })
            }}
            placeholder="Search country or code"
            aria-label="Search countries"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${results[active].alpha2}` : undefined}
            className="h-11 w-full bg-transparent text-sm text-foreground placeholder:text-[#9aa8ba] focus:outline-none"
          />
        </div>
        <div ref={listRef} id={listId} role="listbox" className="max-h-72 overflow-y-auto p-1">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No country matches &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            results.map((c, i) => {
              const isSelected = c.alpha2 === value
              return (
                <div
                  key={c.id}
                  id={`${listId}-${c.alpha2}`}
                  role="option"
                  aria-selected={isSelected}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => pick(c)}
                  className={cn(
                    'flex h-10 cursor-pointer items-center gap-3 rounded-[8px] px-2.5 text-sm text-[#526581]',
                    i === active && 'bg-[#f6f9fd] text-foreground',
                    isSelected && 'text-[#21649c]',
                  )}
                >
                  <CountryFlag flagUrl={c.flagUrl} alpha2={c.alpha2} className="h-[15px] w-5" />
                  <span className="min-w-0 flex-1 truncate">
                    <Highlight text={c.name} query={query} />
                  </span>
                  {isSelected ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <span className="text-xs font-medium tracking-[0.06em] text-[#aab5c4]">{c.alpha2}</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
