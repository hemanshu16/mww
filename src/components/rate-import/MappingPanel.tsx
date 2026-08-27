import type { ReactNode } from 'react'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { columnOptions } from '@/lib/rateImport/mappingView'
import type {
  MatchType,
  ParsedSheet,
  RatesRegion,
  SheetMapping,
  SlabType,
  ZoneMapRegion,
} from '@/lib/rateImport/types'
import { cn } from '@/lib/utils'

const MATCH_TYPES: MatchType[] = [
  'postcode_exact',
  'postcode_range',
  'zip_prefix',
  'state',
  'fsa_prefix',
  'country',
]

interface MappingPanelProps {
  sheet: ParsedSheet
  mapping: SheetMapping
  onChange: (next: SheetMapping) => void
  onRedetect: () => void
}

function defaultRates(sheet: ParsedSheet): RatesRegion {
  return {
    headerRow: 0,
    firstDataRow: 1,
    lastDataRow: Math.max(1, sheet.rows.length - 1),
    weightCol: 0,
    zoneCols: [{ col: 1, zone: 'ZONE 1' }],
    slabBreakRow: null,
    slabBreakType: 'per_kg',
    pricingMode: 'zoned',
  }
}

function defaultZoneMap(sheet: ParsedSheet): ZoneMapRegion {
  return {
    headerRow: 0,
    firstDataRow: 1,
    lastDataRow: Math.max(1, sheet.rows.length - 1),
    matchType: 'postcode_exact',
    pairs: [{ loCol: 0, hiCol: null, zoneCol: 1 }],
    remoteCol: null,
  }
}

// --- small styled controls ---------------------------------------------------

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: number | string
  onChange: (v: string) => void
  options: { value: number | string; label: string }[]
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-9 rounded-lg border border-input bg-card px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function NumberInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: number | ''
  onChange: (v: number | '') => void
  placeholder?: string
  className?: string
}) {
  return (
    <input
      type="number"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      className={cn(
        'h-9 w-full rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30',
        className,
      )}
    />
  )
}

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary',
      )}
    >
      <span
        className={cn(
          'inline-block size-2 rounded-full',
          checked ? 'bg-primary-foreground' : 'bg-muted-foreground/50',
        )}
      />
      {children}
    </button>
  )
}

// --- panel -------------------------------------------------------------------

export function MappingPanel({ sheet, mapping, onChange, onRedetect }: MappingPanelProps) {
  const { rates, zoneMap } = mapping

  function patch(next: Partial<SheetMapping>) {
    onChange({ ...mapping, detected: false, ...next })
  }
  function patchRates(next: Partial<RatesRegion>) {
    if (!rates) return
    patch({ rates: { ...rates, ...next } })
  }
  function patchZoneMap(next: Partial<ZoneMapRegion>) {
    if (!zoneMap) return
    patch({ zoneMap: { ...zoneMap, ...next } })
  }

  const rateCols = rates ? columnOptions(sheet, rates.headerRow) : []
  const zmCols = zoneMap ? columnOptions(sheet, zoneMap.headerRow) : []

  return (
    <Card className="gap-4 p-5">
      {/* Header + role */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-wider text-primary uppercase">
            Step 2 · Map this sheet
          </span>
          {mapping.detected && mapping.confidence === 'low' && (
            <span className="rounded-full bg-gold-200 px-2 py-0.5 text-[10px] font-bold text-gold-800 uppercase">
              Low confidence
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onRedetect}>
          <Sparkles className="size-4" />
          Auto-detect
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Toggle checked={mapping.include} onChange={(v) => patch({ include: v })}>
          {mapping.include ? 'Included' : 'Ignored'}
        </Toggle>
        {mapping.include && (
          <>
            <Toggle
              checked={rates !== null}
              onChange={(v) => patch({ rates: v ? defaultRates(sheet) : null })}
            >
              Rate table
            </Toggle>
            <Toggle
              checked={zoneMap !== null}
              onChange={(v) => patch({ zoneMap: v ? defaultZoneMap(sheet) : null })}
            >
              Zone map
            </Toggle>
          </>
        )}
      </div>

      {!mapping.include && (
        <p className="text-sm text-muted-foreground">
          This sheet is ignored — nothing from it will be exported. Toggle{' '}
          <span className="font-semibold">Included</span> to map it.
        </p>
      )}

      {/* Rates region */}
      {mapping.include && rates && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-block size-3 rounded-sm bg-blue-300" />
            Rate table
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Header row">
              <NumberInput
                value={rates.headerRow + 1}
                onChange={(v) => {
                  const hr = v === '' ? 0 : Math.max(1, v) - 1
                  patchRates({ headerRow: hr, firstDataRow: hr + 1 })
                }}
              />
            </Field>
            <Field label="Weight column">
              <Select
                value={rates.weightCol}
                onChange={(v) => patchRates({ weightCol: Number(v) })}
                options={rateCols}
              />
            </Field>
            <Field label="Last data row">
              <NumberInput
                value={rates.lastDataRow + 1}
                onChange={(v) => patchRates({ lastDataRow: (v === '' ? 1 : v) - 1 })}
              />
            </Field>
          </div>

          {/* Zone columns */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Zone columns ({rates.zoneCols.length})
            </span>
            {rates.zoneCols.map((zc, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={zc.col}
                  onChange={(v) => {
                    const next = [...rates.zoneCols]
                    next[i] = { ...next[i], col: Number(v) }
                    patchRates({ zoneCols: next })
                  }}
                  options={rateCols}
                  className="flex-1"
                />
                <input
                  value={zc.zone}
                  onChange={(e) => {
                    const next = [...rates.zoneCols]
                    next[i] = { ...next[i], zone: e.target.value }
                    patchRates({ zoneCols: next })
                  }}
                  placeholder="Zone label"
                  className="h-9 w-28 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
                <button
                  type="button"
                  onClick={() => patchRates({ zoneCols: rates.zoneCols.filter((_, j) => j !== i) })}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove zone column"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => {
                const nextCol =
                  rates.zoneCols.length > 0
                    ? rates.zoneCols[rates.zoneCols.length - 1].col + 1
                    : rates.weightCol + 1
                patchRates({
                  zoneCols: [
                    ...rates.zoneCols,
                    { col: nextCol, zone: `ZONE ${rates.zoneCols.length + 1}` },
                  ],
                })
              }}
            >
              <Plus className="size-4" />
              Add zone
            </Button>
          </div>

          {/* Slab break + pricing mode */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Slab break row">
              <NumberInput
                value={rates.slabBreakRow === null ? '' : rates.slabBreakRow + 1}
                placeholder="none"
                onChange={(v) => patchRates({ slabBreakRow: v === '' ? null : v - 1 })}
              />
            </Field>
            <Field label="Above-break price">
              <Select
                value={rates.slabBreakType}
                onChange={(v) =>
                  patchRates({ slabBreakType: v as SlabType as 'per_kg' | 'per_box' })
                }
                options={[
                  { value: 'per_kg', label: 'per kg' },
                  { value: 'per_box', label: 'per box' },
                ]}
              />
            </Field>
            <Field label="Pricing mode">
              <div className="flex gap-1.5">
                {(['zoned', 'flat'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => patchRates({ pricingMode: m })}
                    className={cn(
                      'h-9 flex-1 rounded-lg border text-xs font-semibold capitalize transition-colors',
                      rates.pricingMode === m
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-card text-muted-foreground hover:border-primary',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Below the break, prices are the shipment total. From the break row down they are{' '}
            {rates.slabBreakType === 'per_kg' ? 'per-kg unit rates' : 'per-box rates'}.
          </p>
        </div>
      )}

      {/* Zone-map region */}
      {mapping.include && zoneMap && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-block size-3 rounded-sm bg-emerald-300" />
            Zone map
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Header row">
              <NumberInput
                value={zoneMap.headerRow + 1}
                onChange={(v) => {
                  const hr = v === '' ? 0 : Math.max(1, v) - 1
                  patchZoneMap({ headerRow: hr, firstDataRow: hr + 1 })
                }}
              />
            </Field>
            <Field label="Match type">
              <Select
                value={zoneMap.matchType}
                onChange={(v) => patchZoneMap({ matchType: v as MatchType })}
                options={MATCH_TYPES.map((t) => ({ value: t, label: t }))}
              />
            </Field>
            <Field label="Remote flag col">
              <Select
                value={zoneMap.remoteCol === null ? '' : zoneMap.remoteCol}
                onChange={(v) => patchZoneMap({ remoteCol: v === '' ? null : Number(v) })}
                options={[{ value: '', label: '— none —' }, ...zmCols]}
              />
            </Field>
          </div>

          {/* Column pairs */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Key → zone pairs ({zoneMap.pairs.length})
            </span>
            {zoneMap.pairs.map((p, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <Select
                  value={p.loCol}
                  onChange={(v) => {
                    const next = [...zoneMap.pairs]
                    next[i] = { ...next[i], loCol: Number(v) }
                    patchZoneMap({ pairs: next })
                  }}
                  options={zmCols}
                  className="flex-1"
                />
                <Select
                  value={p.hiCol === null ? '' : p.hiCol}
                  onChange={(v) => {
                    const next = [...zoneMap.pairs]
                    next[i] = { ...next[i], hiCol: v === '' ? null : Number(v) }
                    patchZoneMap({ pairs: next })
                  }}
                  options={[{ value: '', label: 'no range hi' }, ...zmCols]}
                  className="flex-1"
                />
                <Select
                  value={p.zoneCol}
                  onChange={(v) => {
                    const next = [...zoneMap.pairs]
                    next[i] = { ...next[i], zoneCol: Number(v) }
                    patchZoneMap({ pairs: next })
                  }}
                  options={zmCols}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => patchZoneMap({ pairs: zoneMap.pairs.filter((_, j) => j !== i) })}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove pair"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() =>
                patchZoneMap({ pairs: [...zoneMap.pairs, { loCol: 0, hiCol: null, zoneCol: 1 }] })
              }
            >
              <Plus className="size-4" />
              Add pair
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
