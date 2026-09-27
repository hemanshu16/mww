import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Country } from '@/lib/types'

export const NO_REGION = '__none__'

interface RegionStat {
  key: string
  label: string
  total: number
  visible: number
}

function buildStats(countries: Country[]): RegionStat[] {
  const map = new Map<string, RegionStat>()
  for (const c of countries) {
    const key = c.region ?? NO_REGION
    const stat = map.get(key) ?? { key, label: c.region ?? 'No region', total: 0, visible: 0 }
    stat.total += 1
    if (c.isVisible) stat.visible += 1
    map.set(key, stat)
  }
  // Largest regions first; "No region" always last.
  return [...map.values()].sort((a, b) =>
    a.key === NO_REGION ? 1 : b.key === NO_REGION ? -1 : b.total - a.total,
  )
}

/**
 * Coverage bar: each segment is a region sized by its country count, filled
 * by how many of those countries customers can book to. Segments double as a
 * region filter for the table below.
 */
export function RegionCoverage({
  countries,
  activeRegion,
  onRegionChange,
}: {
  countries: Country[]
  activeRegion: string | null
  onRegionChange: (region: string | null) => void
}) {
  const stats = useMemo(() => buildStats(countries), [countries])
  const [hovered, setHovered] = useState<string | null>(null)
  const total = countries.length
  const visible = countries.filter((c) => c.isVisible).length
  const focus = hovered ?? activeRegion

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-[15px] font-semibold text-foreground">Shipping coverage</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{visible}</span> of{' '}
          <span className="tabular-nums">{total}</span> countries open for booking
        </p>
      </div>

      {/* Each region is one column: its bar segment (width ∝ country count) over its label. */}
      <div
        className="mt-4 grid grid-cols-2 gap-x-[3px] gap-y-2 sm:flex"
        role="group"
        aria-label="Filter by region"
      >
        {stats.map((s) => {
          const active = activeRegion === s.key
          const dimmed = !!focus && focus !== s.key
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={active}
              aria-label={`${s.label}: ${s.visible} of ${s.total} open`}
              onClick={() => onRegionChange(active ? null : s.key)}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(s.key)}
              onBlur={() => setHovered(null)}
              style={{ flex: `${s.total} 1 0`, minWidth: 104 }}
              className="group rounded-[8px] text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
            >
              <span
                aria-hidden
                className={cn(
                  'relative block h-3 overflow-hidden rounded-[3px] bg-[#e4eaf1] transition-opacity duration-200',
                  dimmed && 'opacity-35',
                )}
              >
                <span
                  className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-300 ease-out"
                  style={{ width: `${(s.visible / s.total) * 100}%` }}
                />
              </span>
              <span
                className={cn(
                  'mt-2 block rounded-[6px] px-1.5 py-1 transition-colors duration-150',
                  active ? 'bg-[#eff6ff]' : 'group-hover:bg-[#f8fafc]',
                )}
              >
              <span
                className={cn(
                  'block truncate text-[13px] font-medium',
                  active ? 'text-[#21649c]' : 'text-foreground',
                )}
              >
                {s.label}
              </span>
              <span className="block text-xs tabular-nums text-muted-foreground">
                {s.visible === s.total ? `All ${s.total} open` : `${s.visible} of ${s.total} open`}
              </span>
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
