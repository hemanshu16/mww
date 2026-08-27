import * as XLSX from 'xlsx'
import type { CellValue, ParsedSheet, ParsedWorkbook } from './types'

/** SHA-256 of the raw file bytes, hex-encoded — used for import idempotency. */
async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Trailing empty rows/columns are extremely common in these sheets (padded to
 * thousands of blank rows). Trim them so the viewer and detectors work on the
 * real extent, not the declared one.
 */
function normalizeGrid(raw: CellValue[][]): { rows: CellValue[][]; cols: number } {
  let lastRow = -1
  let cols = 0
  raw.forEach((row, r) => {
    let lastCol = -1
    row.forEach((v, c) => {
      if (v !== null && v !== '') {
        lastCol = c
        lastRow = r
      }
    })
    if (lastCol + 1 > cols) cols = lastCol + 1
  })
  const trimmed = raw.slice(0, lastRow + 1).map((row) => {
    const next = row.slice(0, cols)
    while (next.length < cols) next.push(null)
    return next
  })
  return { rows: trimmed, cols }
}

function sheetToGrid(ws: XLSX.WorkSheet): ParsedSheet['rows'] {
  // Without an explicit range, sheet_to_json decodes ws['!ref'] as-is. If a
  // sheet's leftmost populated cell isn't in column A (true of several ACX
  // sheets), SheetJS silently starts array index 0 at that column instead —
  // every hardcoded/displayed column index would then be off by however many
  // columns were skipped. Force the range to always start at column A so
  // index 0 reliably means spreadsheet column A.
  const ref = ws['!ref']
  let range: XLSX.Range | undefined
  if (ref) {
    const decoded = XLSX.utils.decode_range(ref)
    range = { s: { r: decoded.s.r, c: 0 }, e: decoded.e }
  }
  // header:1 → array-of-arrays; raw:true keeps numbers as numbers; defval:null
  // fills gaps so rows stay aligned by column index.
  const aoa = XLSX.utils.sheet_to_json<CellValue[]>(ws, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
    range,
  })
  return aoa.map((row) =>
    (row ?? []).map((v) => {
      if (v === undefined || v === null) return null
      if (typeof v === 'string') {
        const t = v.replace(/ /g, ' ').trim()
        return t === '' ? null : t
      }
      return v as CellValue
    }),
  )
}

export async function parseWorkbook(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer()
  const sha256 = await sha256Hex(buffer)
  // cellDates keeps effective-date cells as real dates rather than serials.
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })

  const sheets: ParsedSheet[] = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name]
    const { rows, cols } = normalizeGrid(sheetToGrid(ws))
    return { name, rows, cols }
  })

  return { fileName: file.name, sha256, sheets }
}

/** A1-style label for a column index (0 → A, 26 → AA). */
export function colLabel(index: number): string {
  let n = index
  let label = ''
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}
