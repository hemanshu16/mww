import { useState } from 'react'
import { colLabel } from '@/lib/rateImport/parseWorkbook'
import type { ParsedSheet } from '@/lib/rateImport/types'
import { cn } from '@/lib/utils'

export interface GridRegion {
  r0: number
  c0: number
  r1: number
  c1: number
}

export type TintRole = 'weight' | 'zone' | 'key' | 'zonelabel' | 'remote'

const HEADER_TINT: Record<TintRole, string> = {
  weight: 'bg-gold-300 text-gold-900',
  zone: 'bg-blue-300 text-blue-900',
  key: 'bg-emerald-200 text-emerald-900',
  zonelabel: 'bg-emerald-300 text-emerald-900',
  remote: 'bg-destructive/25 text-destructive',
}
const CELL_TINT: Record<TintRole, string> = {
  weight: 'bg-gold-100',
  zone: 'bg-blue-100',
  key: 'bg-emerald-50',
  zonelabel: 'bg-emerald-100',
  remote: 'bg-destructive/8',
}

interface SheetGridProps {
  sheet: ParsedSheet
  /** Highlighted rectangle (e.g. the detected rate table). */
  highlight?: GridRegion | null
  /** A single emphasised cell (e.g. the header anchor). */
  anchor?: { r: number; c: number } | null
  /** Column-index → role, used to colour role columns. */
  columnTints?: Record<number, TintRole>
  /** Row treated as the header (its cells get the tint at full strength). */
  headerRow?: number | null
  onCellClick?: (r: number, c: number) => void
  className?: string
}

const ROW_H = 28
const COL_W = 116
const IDX_W = 56
const OVERSCAN = 8

function inRegion(region: GridRegion | null | undefined, r: number, c: number): boolean {
  if (!region) return false
  return r >= region.r0 && r <= region.r1 && c >= region.c0 && c <= region.c1
}

/**
 * Display formatting only — the parsed value is preserved for export. Strips
 * floating-point noise (933.0999999999999 → 933.1) without lying about integers.
 */
function displayValue(value: string | number | boolean | null): string {
  if (value === null) return ''
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value)
    return String(Math.round(value * 1000) / 1000)
  }
  return String(value)
}

const VIEWPORT_H = 520

export function SheetGrid({
  sheet,
  highlight,
  anchor,
  columnTints,
  headerRow,
  onCellClick,
  className,
}: SheetGridProps) {
  const [scrollTop, setScrollTop] = useState(0)

  const total = sheet.rows.length
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN)
  const visibleCount = Math.ceil(VIEWPORT_H / ROW_H) + OVERSCAN * 2
  const end = Math.min(total, start + visibleCount)

  const topPad = start * ROW_H
  const bottomPad = Math.max(0, (total - end) * ROW_H)
  const rowWidth = IDX_W + sheet.cols * COL_W

  return (
    <div
      className={cn(
        'relative overflow-auto rounded-2xl border border-border bg-card font-mono text-[12px]',
        className,
      )}
      style={{ maxHeight: VIEWPORT_H }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ width: rowWidth }}>
        {/* Header row — column letters */}
        <div
          className="sticky top-0 z-20 flex border-b border-border bg-secondary"
          style={{ height: ROW_H }}
        >
          <div
            className="sticky left-0 z-10 flex shrink-0 items-center justify-center border-r border-border bg-secondary text-[11px] font-semibold text-muted-foreground"
            style={{ width: IDX_W }}
          />
          {Array.from({ length: sheet.cols }, (_, c) => (
            <div
              key={c}
              className="flex shrink-0 items-center justify-center border-r border-border text-[11px] font-semibold text-muted-foreground"
              style={{ width: COL_W }}
            >
              {colLabel(c)}
            </div>
          ))}
        </div>

        <div style={{ height: topPad }} />

        {sheet.rows.slice(start, end).map((row, i) => {
          const r = start + i
          return (
            <div key={r} className="flex" style={{ height: ROW_H }}>
              {/* Row number — sticky left */}
              <div
                className="sticky left-0 z-10 flex shrink-0 items-center justify-center border-r border-b border-border bg-secondary text-[11px] font-semibold text-muted-foreground"
                style={{ width: IDX_W }}
              >
                {r + 1}
              </div>
              {Array.from({ length: sheet.cols }, (_, c) => {
                const value = row[c]
                const highlighted = inRegion(highlight, r, c)
                const isAnchor = anchor?.r === r && anchor?.c === c
                const tint = columnTints?.[c]
                const isHeaderCell = headerRow === r && tint !== undefined
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={onCellClick ? () => onCellClick(r, c) : undefined}
                    className={cn(
                      'flex shrink-0 items-center overflow-hidden border-r border-b border-border px-2 text-left whitespace-nowrap',
                      onCellClick ? 'cursor-cell' : 'cursor-default',
                      // background precedence: anchor > header-tint > col-tint > region > default
                      isAnchor
                        ? 'bg-primary text-primary-foreground'
                        : isHeaderCell && tint
                          ? HEADER_TINT[tint]
                          : tint
                            ? CELL_TINT[tint]
                            : highlighted
                              ? 'bg-secondary/60'
                              : 'bg-card',
                      typeof value === 'number' &&
                        !isAnchor &&
                        !tint &&
                        'justify-end text-blue-800',
                      typeof value === 'number' && tint === 'zone' && 'justify-end',
                    )}
                    style={{ width: COL_W }}
                    title={value === null ? '' : String(value)}
                  >
                    {displayValue(value)}
                  </button>
                )
              })}
            </div>
          )
        })}

        <div style={{ height: bottomPad }} />
      </div>
    </div>
  )
}
