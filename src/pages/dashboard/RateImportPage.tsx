import { useRef, useState } from 'react'
import { FileSpreadsheet, Loader2, Upload, X } from 'lucide-react'
import { MappingPanel } from '@/components/rate-import/MappingPanel'
import { SheetGrid } from '@/components/rate-import/SheetGrid'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { detectSheet, detectWorkbook } from '@/lib/rateImport/detect'
import { buildTints, ratesHighlight } from '@/lib/rateImport/mappingView'
import { parseWorkbook } from '@/lib/rateImport/parseWorkbook'
import type { ParsedWorkbook, SheetMapping } from '@/lib/rateImport/types'
import { cn } from '@/lib/utils'

function roleTag(m: SheetMapping): { label: string; tone: string } {
  if (!m.include) return { label: 'ignore', tone: 'bg-neutral-300 text-neutral-800' }
  if (m.rates && m.zoneMap) return { label: 'rates + map', tone: 'bg-blue-300 text-blue-900' }
  if (m.rates) return { label: 'rates', tone: 'bg-blue-300 text-blue-900' }
  if (m.zoneMap) return { label: 'zone map', tone: 'bg-emerald-300 text-emerald-900' }
  return { label: 'set up', tone: 'bg-gold-200 text-gold-800' }
}

function RateImportPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null)
  const [mappings, setMappings] = useState<SheetMapping[]>([])
  const [activeSheet, setActiveSheet] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!/\.xlsx?$/i.test(file.name)) {
      setError('Please choose an .xlsx or .xls file.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const parsed = await parseWorkbook(file)
      setWorkbook(parsed)
      setMappings(detectWorkbook(parsed.sheets))
      setActiveSheet(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this workbook.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setWorkbook(null)
    setMappings([])
    setActiveSheet(0)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function updateMapping(next: SheetMapping) {
    setMappings((prev) => prev.map((m) => (m.sheetIndex === next.sheetIndex ? next : m)))
  }

  if (!workbook) {
    return (
      <div className="max-w-[720px]">
        <Card className="gap-5 p-6">
          <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
            Step 1 · Upload rate sheet
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a courier provider&rsquo;s Excel rate sheet. Every worksheet is read in the
            browser — nothing is uploaded to a server yet. You&rsquo;ll classify each sheet and map
            its columns in the next steps.
          </p>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              void handleFile(e.dataTransfer.files?.[0])
            }}
            className={cn(
              'flex min-h-52 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-input bg-muted/40 p-8 text-center transition-colors hover:border-primary hover:bg-accent',
              dragOver && 'border-primary bg-accent',
            )}
          >
            {loading ? (
              <Loader2 className="size-8 animate-spin text-primary" />
            ) : (
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
                <Upload className="size-6" />
              </span>
            )}
            <div className="text-sm font-semibold">
              {loading ? 'Reading workbook…' : 'Drop an .xlsx here, or click to browse'}
            </div>
            <div className="text-xs text-muted-foreground">
              ACX, Skynet, FedEx, FLySwift, Australia Self, SSSI Canada…
            </div>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />

          {error && (
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </Card>
      </div>
    )
  }

  const sheet = workbook.sheets[activeSheet]
  const mapping = mappings[activeSheet]
  const tints = mapping ? buildTints(mapping) : {}
  const highlight = mapping ? ratesHighlight(mapping) : null
  const headerRow = mapping?.rates?.headerRow ?? mapping?.zoneMap?.headerRow ?? null

  const counts = mappings.reduce(
    (acc, m) => {
      if (!m.include) acc.ignored++
      else {
        if (m.rates) acc.rates++
        if (m.zoneMap) acc.maps++
      }
      return acc
    },
    { rates: 0, maps: 0, ignored: 0 },
  )

  function handleCellClick(r: number) {
    if (!mapping) return
    // Clicking a cell re-anchors the header row of the region being edited.
    if (mapping.rates) {
      updateMapping({
        ...mapping,
        detected: false,
        rates: { ...mapping.rates, headerRow: r, firstDataRow: r + 1 },
      })
    } else if (mapping.zoneMap) {
      updateMapping({
        ...mapping,
        detected: false,
        zoneMap: { ...mapping.zoneMap, headerRow: r, firstDataRow: r + 1 },
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* File header */}
      <Card className="flex-row items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <FileSpreadsheet className="size-5.5" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{workbook.fileName}</div>
            <div className="truncate font-mono text-[11px] text-muted-foreground">
              {workbook.sheets.length} sheets · {counts.rates} rate · {counts.maps} map ·{' '}
              {counts.ignored} ignored · sha256 {workbook.sha256.slice(0, 10)}…
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="shrink-0">
          <X className="size-4" />
          Choose another file
        </Button>
      </Card>

      {/* Sheet tabs with role badges */}
      <div className="flex flex-wrap gap-1.5">
        {workbook.sheets.map((s, i) => {
          const tag = roleTag(mappings[i])
          return (
            <button
              key={s.name + i}
              type="button"
              onClick={() => setActiveSheet(i)}
              className={cn(
                'flex items-center gap-1.5 rounded-full py-1.5 pr-2 pl-3.5 text-xs font-semibold whitespace-nowrap transition-colors',
                i === activeSheet
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-accent hover:text-primary',
              )}
              title={s.name}
            >
              <span className="max-w-40 truncate">{s.name || `Sheet ${i + 1}`}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] tracking-wide uppercase',
                  tag.tone,
                )}
              >
                {tag.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid + mapping panel */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{sheet.name}</span>
            <span>
              {sheet.rows.length} rows × {sheet.cols} cols · click a cell to set the header row
            </span>
          </div>
          {sheet.rows.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              This sheet is empty.
            </Card>
          ) : (
            <SheetGrid
              sheet={sheet}
              highlight={highlight}
              columnTints={tints}
              headerRow={headerRow}
              onCellClick={(r) => handleCellClick(r)}
            />
          )}
        </div>

        {mapping && (
          <div className="w-full shrink-0 xl:w-[420px]">
            <MappingPanel
              sheet={sheet}
              mapping={mapping}
              onChange={updateMapping}
              onRedetect={() => updateMapping(detectSheet(sheet, activeSheet))}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default RateImportPage
