// Auto-detection heuristics for a parsed worksheet.
//
// The wizard proposes a mapping; the admin confirms or corrects it. Detection is
// deliberately conservative: when unsure it lowers `confidence` rather than
// guessing wildly, so the admin knows where to look.

import type {
  CellValue,
  ParsedSheet,
  RatesRegion,
  SheetMapping,
  ZoneMapPair,
  ZoneMapRegion,
} from './types'

const HEADER_SCAN_ROWS = 25

const WEIGHT_RE = /^\s*(weight|wt|kg|weight[_ ]?kg)\b/i
const ZONE_RE = /^\s*(zone\b|zone\s*[a-n]\b|d\d{1,2}\b|zone\s*\d)/i
const ZONE_LOOSE_RE = /zone|^d\d{2}$/i
const POSTCODE_HDR_RE = /post\s*code|pincode|zip|fsa|zip\s*code/i
const ZONE_HDR_RE = /^\s*zones?\s*$/i
const REMOTE_HDR_RE = /remote/i
const PKG_RE = /pkg|per\s*kg|p\.?\s?k\.?\s?g/i
const IGNORE_NAME_RE = /index|contact|tracking|matrix|instruction|terms|t&c/i

function text(v: CellValue): string {
  return v === null ? '' : String(v).trim()
}

function toNumber(v: CellValue): number | null {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const m = v.trim().match(/-?\d+(\.\d+)?/)
    if (m) return Number(m[0])
  }
  return null
}

/** A cell that opens a weight slab: a number, or "6 PKG" / "0.5Kg" / "6Kg-10Kg". */
function isWeightCell(v: CellValue): boolean {
  if (typeof v === 'number') return true
  const s = text(v)
  return /^\d+(\.\d+)?\s*(pkg|kg|gms?)?/i.test(s) || /^\d+\s*(kg|gms?)\b/i.test(s)
}

// ---------------------------------------------------------------------------
// Rate-table detection
// ---------------------------------------------------------------------------

function findRatesHeader(sheet: ParsedSheet): { row: number; weightCol: number } | null {
  let best: { row: number; weightCol: number; score: number } | null = null
  const scan = Math.min(HEADER_SCAN_ROWS, sheet.rows.length)
  for (let r = 0; r < scan; r++) {
    const row = sheet.rows[r]
    let weightCol = -1
    let zoneCount = 0
    for (let c = 0; c < row.length; c++) {
      const t = text(row[c])
      if (weightCol === -1 && WEIGHT_RE.test(t)) weightCol = c
      if (ZONE_RE.test(t)) zoneCount++
    }
    // A rates header needs zone columns; a weight column is a strong bonus.
    if (zoneCount >= 1) {
      const score = zoneCount + (weightCol >= 0 ? 10 : 0)
      if (!best || score > best.score) {
        best = { row: r, weightCol: weightCol >= 0 ? weightCol : findWeightColFallback(row), score }
      }
    }
  }
  return best ? { row: best.row, weightCol: best.weightCol } : null
}

/** When no explicit weight header, the weight column is the one just left of the first zone. */
function findWeightColFallback(headerRow: CellValue[]): number {
  for (let c = 0; c < headerRow.length; c++) {
    if (ZONE_RE.test(text(headerRow[c]))) return Math.max(0, c - 1)
  }
  return 0
}

function detectRates(sheet: ParsedSheet): RatesRegion | null {
  const header = findRatesHeader(sheet)
  if (!header) return null
  const { row: headerRow, weightCol } = header
  const hdr = sheet.rows[headerRow]

  // Candidate zone columns to the right of weight. Keep only the *contiguous*
  // run: a side-by-side zone/state map often sits further right with headers that
  // also read "Zone 2…", separated from the rate table by a blank column.
  const candidates = hdr
    .map((v, c) => ({ col: c, zone: text(v) }))
    .filter(({ col, zone }) => col > weightCol && ZONE_RE.test(zone))
  const zoneCols: { col: number; zone: string }[] = []
  for (const zc of candidates) {
    if (zoneCols.length === 0 || zc.col === zoneCols[zoneCols.length - 1].col + 1) {
      zoneCols.push(zc)
    } else {
      break
    }
  }
  if (zoneCols.length === 0) return null

  // Walk down while the weight column still looks like a weight; tolerate one gap.
  const firstDataRow = headerRow + 1
  let lastDataRow = headerRow
  let gap = 0
  for (let r = firstDataRow; r < sheet.rows.length; r++) {
    if (isWeightCell(sheet.rows[r][weightCol])) {
      lastDataRow = r
      gap = 0
    } else if (text(sheet.rows[r][weightCol]) === '') {
      gap++
      if (gap > 1) break
    } else {
      break // a non-weight label (notes / T&C) ends the table
    }
  }
  if (lastDataRow < firstDataRow) return null

  const { slabBreakRow, slabBreakType } = detectSlabBreak(
    sheet,
    weightCol,
    zoneCols[0].col,
    firstDataRow,
    lastDataRow,
  )

  const pricingMode = zoneCols.length === 1 && !/zone/i.test(zoneCols[0].zone) ? 'flat' : 'zoned'

  return {
    headerRow,
    firstDataRow,
    lastDataRow,
    weightCol,
    zoneCols,
    slabBreakRow,
    slabBreakType,
    pricingMode,
  }
}

/**
 * The two-regime break: below it prices are `total`, above it `per_kg` (or per_box).
 * Prefer an explicit "PKG" label; otherwise fall back to a sharp price drop
 * (per-kg unit rates are far smaller than cumulative totals).
 */
function detectSlabBreak(
  sheet: ParsedSheet,
  weightCol: number,
  firstZoneCol: number,
  firstDataRow: number,
  lastDataRow: number,
): { slabBreakRow: number | null; slabBreakType: 'per_kg' | 'per_box' } {
  for (let r = firstDataRow; r <= lastDataRow; r++) {
    if (PKG_RE.test(text(sheet.rows[r][weightCol]))) {
      return { slabBreakRow: r, slabBreakType: 'per_kg' }
    }
  }
  let prev: number | null = null
  for (let r = firstDataRow; r <= lastDataRow; r++) {
    const price = toNumber(sheet.rows[r][firstZoneCol])
    if (price !== null && prev !== null && price < prev * 0.5) {
      return { slabBreakRow: r, slabBreakType: 'per_kg' }
    }
    if (price !== null) prev = price
  }
  return { slabBreakRow: null, slabBreakType: 'per_kg' }
}

// ---------------------------------------------------------------------------
// Zone-map detection
// ---------------------------------------------------------------------------

function guessMatchType(sampleKeys: string[]): ZoneMapRegion['matchType'] {
  const nonEmpty = sampleKeys.filter((s) => s !== '')
  if (nonEmpty.length === 0) return 'postcode_exact'
  const fsaLike = nonEmpty.filter((s) => /^[a-z]\d[a-z]$/i.test(s)).length
  const stateLike = nonEmpty.filter((s) => /^[a-z]{2}$/i.test(s)).length
  const numeric = nonEmpty.filter((s) => /^\d{3,6}$/.test(s)).length
  const ratio = (n: number) => n / nonEmpty.length
  if (ratio(fsaLike) > 0.6) return 'fsa_prefix'
  if (ratio(stateLike) > 0.6) return 'state'
  if (ratio(numeric) > 0.6) return 'postcode_exact'
  return 'postcode_exact'
}

function detectZoneMap(sheet: ParsedSheet): ZoneMapRegion | null {
  // Find a header row that pairs a postcode-ish column with a zone column.
  const scan = Math.min(HEADER_SCAN_ROWS, sheet.rows.length)
  for (let r = 0; r < scan; r++) {
    const row = sheet.rows[r]
    const pairs: ZoneMapPair[] = []
    let remoteCol: number | null = null
    for (let c = 0; c < row.length; c++) {
      const t = text(row[c])
      if (POSTCODE_HDR_RE.test(t)) {
        // The zone column is the nearest ZONE header to the right.
        for (let z = c + 1; z < Math.min(c + 4, row.length); z++) {
          if (ZONE_HDR_RE.test(text(row[z])) || ZONE_LOOSE_RE.test(text(row[z]))) {
            pairs.push({ loCol: c, hiCol: null, zoneCol: z })
            break
          }
        }
      }
      if (REMOTE_HDR_RE.test(t)) remoteCol = c
    }
    if (pairs.length > 0) {
      // Data extent from the first pair's key column.
      const keyCol = pairs[0].loCol
      const firstDataRow = r + 1
      let lastDataRow = r
      const sampleKeys: string[] = []
      for (let d = firstDataRow; d < sheet.rows.length; d++) {
        const key = text(sheet.rows[d][keyCol])
        if (key !== '') {
          lastDataRow = d
          if (sampleKeys.length < 40) sampleKeys.push(key)
        }
      }
      if (lastDataRow < firstDataRow) continue
      return {
        headerRow: r,
        firstDataRow,
        lastDataRow,
        matchType: guessMatchType(sampleKeys),
        pairs,
        remoteCol,
      }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Top-level
// ---------------------------------------------------------------------------

export function detectSheet(sheet: ParsedSheet, sheetIndex: number): SheetMapping {
  if (IGNORE_NAME_RE.test(sheet.name) || sheet.rows.length === 0) {
    return {
      sheetIndex,
      include: false,
      rates: null,
      zoneMap: null,
      detected: true,
      confidence: sheet.rows.length === 0 ? 'none' : 'high',
    }
  }

  let rates = detectRates(sheet)
  const zoneMap = detectZoneMap(sheet)

  // A single zone column alongside a detected zone map is the map's own zone
  // column, not a one-zone rate table — suppress the phantom. (A genuine single
  // -column service is priced flat and isn't picked up by the zone regex.)
  if (rates && zoneMap && rates.zoneCols.length === 1) {
    rates = null
  }

  const include = Boolean(rates || zoneMap)
  const confidence: SheetMapping['confidence'] = rates || zoneMap ? 'high' : 'low'

  return { sheetIndex, include, rates, zoneMap, detected: true, confidence }
}

export function detectWorkbook(sheets: ParsedSheet[]): SheetMapping[] {
  return sheets.map((s, i) => detectSheet(s, i))
}
