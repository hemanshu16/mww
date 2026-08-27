import { useRef, useState } from 'react'
import { CheckCircle2, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react'
import { SheetGrid } from '@/components/rate-import/SheetGrid'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { parseWorkbook } from '@/lib/rateImport/parseWorkbook'
import type { ParsedWorkbook } from '@/lib/rateImport/types'
import {
  parserDefinition,
  previewWithParser,
  RATE_SHEET_PARSERS,
  type RateSheetParserId,
} from '@/lib/rateImport2/parsers'
import { cn } from '@/lib/utils'

function RateImport2Page() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [parserId, setParserId] = useState<RateSheetParserId>('acx')
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null)
  const [activeSheet, setActiveSheet] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const parser = parserDefinition(parserId)
  const sheet = workbook?.sheets[activeSheet]
  const preview = sheet ? previewWithParser(parserId, sheet) : null

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
      setActiveSheet(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this workbook.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setWorkbook(null)
    setActiveSheet(0)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex max-w-[1500px] flex-col gap-5">
      <Card className="gap-4 p-6">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
            Step 1 · Choose a workbook parser
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Select the rate-sheet format before uploading. The chosen parser controls how rate,
            zone, country and postcode data are interpreted.
          </p>
        </div>
        <label className="flex max-w-2xl flex-col gap-2 text-sm font-semibold">
          Rate-sheet format
          <select
            value={parserId}
            onChange={(event) => setParserId(event.target.value as RateSheetParserId)}
            className="h-11 rounded-xl border border-input bg-card px-3 text-sm font-medium outline-none focus:border-primary"
          >
            {RATE_SHEET_PARSERS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-xl bg-secondary/70 px-4 py-3 text-sm">
          <span className="font-semibold">{parser.label}: </span>
          <span className="text-muted-foreground">{parser.description}</span>
        </div>
      </Card>

      {!workbook ? (
        <Card className="gap-5 p-6">
          <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
            Step 2 · Upload the selected workbook
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragOver(false)
              void handleFile(event.dataTransfer.files?.[0])
            }}
            className={cn(
              'flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-input bg-muted/40 p-8 text-center transition-colors hover:border-primary hover:bg-accent',
              dragOver && 'border-primary bg-accent',
            )}
          >
            {loading ? (
              <Loader2 className="size-8 animate-spin text-primary" />
            ) : (
              <Upload className="size-8 text-primary" />
            )}
            <span className="text-sm font-semibold">
              {loading ? 'Reading workbook…' : 'Drop an Excel workbook here, or click to browse'}
            </span>
            <span className="text-xs text-muted-foreground">Parser: {parser.label}</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          {error && (
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </Card>
      ) : (
        <>
          <Card className="flex-row items-center justify-between gap-4 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <FileSpreadsheet className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{workbook.fileName}</div>
                <div className="text-xs text-muted-foreground">
                  {workbook.sheets.length} sheets · parser: {parser.label}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              <X className="size-4" />
              Choose another file
            </Button>
          </Card>

          <Card className="gap-4 p-5">
            <div>
              <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
                Step 3 · Select worksheet
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Select the specific rate or location sheet to parse. All raw rows remain available
                in the preview below.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {workbook.sheets.map((item, index) => (
                <button
                  key={`${item.name}-${index}`}
                  type="button"
                  onClick={() => setActiveSheet(index)}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-xs font-semibold transition-colors',
                    index === activeSheet
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-accent hover:text-primary',
                  )}
                >
                  {item.name || `Sheet ${index + 1}`}
                </button>
              ))}
            </div>
          </Card>

          {sheet && preview && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Raw sheet preview · {sheet.name}
                  </span>
                  <span>
                    {sheet.rows.length} rows × {sheet.cols} columns
                  </span>
                </div>
                <SheetGrid sheet={sheet} headerRow={preview.headerRow} />
              </div>
              <Card className="h-fit gap-4 p-5">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-semibold">Parser preview</div>
                    <p className="mt-1 text-xs text-muted-foreground">{preview.message}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Configuration</dt>
                    <dd className="mt-0.5 font-semibold capitalize">
                      {preview.configuration.replace('_', ' ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Zone lookup</dt>
                    <dd className="mt-0.5 font-semibold">
                      {preview.hasZoneMap ? 'Detected' : 'Not in this sheet'}
                    </dd>
                  </div>
                </dl>
                {preview.rateRows.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-border">
                    <div className="border-b border-border bg-secondary px-3 py-2 text-xs font-semibold">
                      Parsed rate sample
                    </div>
                    <div className="max-h-64 overflow-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-card text-muted-foreground">
                          <tr>
                            <th className="p-2 font-medium">Weight</th>
                            <th className="p-2 font-medium">First prices</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rateRows.map((row) => (
                            <tr key={row.weight} className="border-t border-border">
                              <td className="p-2 font-semibold">{row.weight}</td>
                              <td className="p-2">
                                {row.prices
                                  .slice(0, 3)
                                  .map((price) => `${price.destination}: ${price.value}`)
                                  .join(' · ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {preview.warnings.length > 0 && (
                  <div className="rounded-xl bg-gold-100 px-3 py-2 text-xs text-gold-800">
                    {preview.warnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default RateImport2Page
