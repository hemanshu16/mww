import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { parseWorkbook } from '@/lib/rateImport/parseWorkbook'
import {
  guessProvider,
  PROVIDER_PARSERS,
  type ProviderParser,
} from '@/lib/rateImport/providers/registry'
import type { ParsedWorkbook, RateSheetExport } from '@/lib/rateImport/types'
import { cn } from '@/lib/utils'

type View = 'summary' | 'json'

function downloadJson(data: RateSheetExport) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${data.provider.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-rates.json`
  a.click()
  URL.revokeObjectURL(url)
}

function ProviderExportPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null)
  const [provider, setProvider] = useState<ProviderParser | null>(null)
  const [result, setResult] = useState<RateSheetExport | null>(null)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [view, setView] = useState<View>('summary')
  const [copied, setCopied] = useState(false)

  const jsonText = useMemo(() => (result ? JSON.stringify(result, null, 2) : ''), [result])

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!/\.xlsx?$/i.test(file.name)) {
      setError('Please choose an .xlsx or .xls file.')
      return
    }
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const parsed = await parseWorkbook(file)
      setWorkbook(parsed)
      const guessed = guessProvider(parsed)
      setProvider(guessed)
      if (!guessed) {
        setError(
          'No dedicated parser recognized this workbook’s sheet layout. Only ACX is supported today.',
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this workbook.')
    } finally {
      setLoading(false)
    }
  }

  function runParser() {
    if (!workbook || !provider) return
    setParsing(true)
    setError(null)
    // Yield a frame so the spinner paints before the (synchronous, large) parse runs.
    setTimeout(() => {
      try {
        setResult(provider.parse(workbook))
        setView('summary')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Parsing failed.')
      } finally {
        setParsing(false)
      }
    }, 30)
  }

  function reset() {
    setWorkbook(null)
    setProvider(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function copyJson() {
    await navigator.clipboard.writeText(jsonText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!workbook) {
    return (
      <div className="max-w-[720px]">
        <Card className="gap-5 p-6">
          <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
            Import a provider rate sheet
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a courier provider&rsquo;s Excel file. It&rsquo;s matched against the dedicated
            parsers below and converted straight to the canonical JSON — no manual mapping.
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

          <div className="text-xs text-muted-foreground">
            Supported today: {PROVIDER_PARSERS.map((p) => p.label).join(', ')}. Other providers
            still need their own parser module.
          </div>
        </Card>
      </div>
    )
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
              {workbook.sheets.length} sheets · sha256 {workbook.sha256.slice(0, 10)}…
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="shrink-0">
          <X className="size-4" />
          Choose another file
        </Button>
      </Card>

      {!result && (
        <Card className="gap-4 p-5">
          {provider ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Detected provider:</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary uppercase">
                  {provider.label}
                </span>
              </div>
              <Button onClick={runParser} disabled={parsing} className="self-start">
                {parsing ? <Loader2 className="size-4 animate-spin" /> : null}
                {parsing ? 'Parsing…' : `Parse with ${provider.label} parser`}
              </Button>
            </>
          ) : (
            <div className="flex items-start gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                No dedicated parser recognized this workbook&rsquo;s sheet layout. Only{' '}
                {PROVIDER_PARSERS.map((p) => p.label).join(', ')}{' '}
                {PROVIDER_PARSERS.length > 1 ? 'are' : 'is'} supported today.
              </span>
            </div>
          )}
        </Card>
      )}

      {result && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Services" value={String(result.services.length)} />
            <StatCard label="Zone maps" value={String(result.zone_maps.length)} />
            <StatCard
              label="Zone rules"
              value={String(result.zone_maps.reduce((n, z) => n + z.rules.length, 0))}
            />
            <StatCard
              label="Warnings"
              value={String(result.warnings.length)}
              note={result.warnings.length > 0 ? 'review before promoting' : 'clean parse'}
            />
          </div>

          <Card className="gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {(['summary', 'json'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap capitalize transition-colors',
                      view === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-accent hover:text-primary',
                    )}
                  >
                    {v === 'json' ? 'Raw JSON' : 'Summary'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {view === 'json' && (
                  <Button variant="outline" size="sm" onClick={() => void copyJson()}>
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                )}
                <Button size="sm" onClick={() => downloadJson(result)}>
                  <Download className="size-4" />
                  Download JSON
                </Button>
              </div>
            </div>

            {view === 'summary' ? (
              <div className="flex flex-col gap-5">
                {result.warnings.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
                      Warnings ({result.warnings.length})
                    </div>
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-border">
                      {result.warnings.map((w, i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex items-start gap-2 px-4 py-2.5 text-xs',
                            i % 2 === 0 ? 'bg-card' : 'bg-muted/40',
                          )}
                        >
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-gold-600" />
                          <span className="text-muted-foreground">{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
                    Services ({result.services.length})
                  </div>
                  <div className="max-h-[520px] overflow-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Zone map</TableHead>
                          <TableHead className="text-right">Slabs</TableHead>
                          <TableHead className="text-right">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.services.map((s) => (
                          <TableRow key={s.code}>
                            <TableCell className="font-mono text-xs">{s.code}</TableCell>
                            <TableCell className="text-xs">
                              {s.dest.type === 'country' ? s.dest.iso2 : s.dest.name}
                              {s.gateway && (
                                <span className="text-muted-foreground"> · {s.gateway}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs capitalize">{s.pricing_mode}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {s.zone_map_ref ?? '—'}
                            </TableCell>
                            <TableCell
                              className={cn(
                                'text-right text-xs',
                                s.slabs.length === 0 && 'font-semibold text-destructive',
                              )}
                            >
                              {s.slabs.length}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {s.notes?.length ?? 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ) : (
              <pre className="max-h-[600px] overflow-auto rounded-xl border border-border bg-neutral-900 p-4 font-mono text-[11px] leading-relaxed text-neutral-100">
                {jsonText}
              </pre>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

export default ProviderExportPage
