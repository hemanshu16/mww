// Reusable table-extraction helpers for dedicated per-provider parsers.
//
// A dedicated parser hard-codes WHERE each service/zone-map sits in a known
// file (sheet name, row/col), but the actual cell-walking logic — weight-row ×
// zone-column tables, destination-row × weight-band tables, "TEMPORARY CLOSED"
// / embedded-rule cells — repeats across providers and even across sheets in
// the same file. These helpers factor that out so a provider module stays a
// short, readable list of "this table lives here, priced like this".

import type { CellValue, ParsedSheet, RateSlab, SlabType } from '../types'

function text(v: CellValue): string {
  return v === null ? '' : String(v).trim()
}

/**
 * Sentinel for an open-ended weight band ("5+", "10+ KG"). JS `Infinity`
 * serializes to `null` in JSON and loses the "and above" meaning — the spec's
 * rate_slab schema documents "a large value for open-ended bands" instead, so
 * we use one consistently everywhere a band has no upper bound.
 */
export const OPEN_ENDED_WEIGHT = 999999

const CLOSED_RE = /temporar\w*\s*closed|^\*{2,}$/i
const NA_RE = /^n\/?a$/i
/** "1kg-5kg : 725/Kg" — a slab rule hidden inside what should be a price cell. */
const EMBEDDED_RULE_RE =
  /(\d+(?:\.\d+)?)\s*kg\s*-\s*(\d+(?:\.\d+)?)\s*kg\s*:\s*(\d+(?:\.\d+)?)\s*\/\s*kg/i

export interface ParsedPrice {
  value: number
  /** Set when the value came from an embedded free-text rule rather than a plain number. */
  ruleText?: string
  /** Set when an embedded rule states its own weight range — takes precedence over the caller's band boundary. */
  range?: { from: number; to: number }
  /** Set when an embedded rule implies its own slab type (e.g. a stated "/Kg" rate) — takes precedence over the caller's. */
  slabTypeOverride?: SlabType
}

/** Interpret one price cell. Returns null for a blank/closed/NA cell (with a reason). */
function parsePriceCell(v: CellValue): { price: ParsedPrice | null; skipReason: string | null } {
  if (typeof v === 'number') return { price: { value: v }, skipReason: null }
  const t = text(v)
  if (t === '') return { price: null, skipReason: null }
  if (CLOSED_RE.test(t)) return { price: null, skipReason: 'closed' }
  if (NA_RE.test(t)) return { price: null, skipReason: 'not available' }
  const rule = t.match(EMBEDDED_RULE_RE)
  if (rule) {
    return {
      price: {
        value: Number(rule[3]),
        ruleText: t,
        range: { from: Number(rule[1]), to: Number(rule[2]) },
        slabTypeOverride: 'per_kg',
      },
      skipReason: null,
    }
  }
  const plain = t.match(/^-?\d+(\.\d+)?/)
  if (plain)
    return {
      price: { value: Number(plain[0]), ruleText: t !== plain[0] ? t : undefined },
      skipReason: null,
    }
  return { price: null, skipReason: `unrecognized value "${t}"` }
}

/** A weight-row label: "1", "0.5", "5+", "20 TO 30", "6kg", "10+ KG". */
function parseWeightLabel(v: CellValue): { from: number; to: number } | null {
  const t = text(v)
  if (t === '') return null
  const range = t.match(/^(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)/i)
  if (range) return { from: Number(range[1]), to: Number(range[2]) }
  const open = t.match(/^(\d+(?:\.\d+)?)\s*\+/)
  if (open) return { from: Number(open[1]), to: OPEN_ENDED_WEIGHT }
  const plain = t.match(/^(\d+(?:\.\d+)?)/)
  if (plain) return { from: Number(plain[1]), to: Number(plain[1]) }
  return null
}

export interface ZoneColSpec {
  col: number
  zone: string
}

/**
 * Weight-rows × zone-columns extraction (archetype A) — also used when each
 * "zone" column is really a distinct destination (e.g. EX MUMBAI AW).
 *
 * `slabTypeAt(weightFrom)` lets the caller express the two-regime break (or
 * "per_kg throughout" by always returning 'per_kg') without this helper
 * needing to know the break rule.
 */
export function extractWeightZoneSlabs(
  sheet: ParsedSheet,
  opts: {
    firstDataRow: number
    lastDataRow: number
    weightCol: number
    zoneCols: ZoneColSpec[]
    slabTypeAt: (weightFrom: number) => SlabType
  },
  warnings: string[],
  context: string,
): RateSlab[] {
  const slabs: RateSlab[] = []
  let prevTo = 0
  for (let r = opts.firstDataRow; r <= opts.lastDataRow; r++) {
    const w = parseWeightLabel(sheet.rows[r]?.[opts.weightCol])
    if (!w) continue
    const weightFrom = w.to === w.from ? prevTo : w.from
    const weightTo = w.to
    const slabType = opts.slabTypeAt(w.from)
    for (const zc of opts.zoneCols) {
      const { price, skipReason } = parsePriceCell(sheet.rows[r]?.[zc.col])
      if (skipReason) {
        if (skipReason !== 'not available') {
          warnings.push(`${context}: ${zc.zone} @ row ${r + 1} skipped (${skipReason})`)
        }
        continue
      }
      if (!price) continue
      if (price.ruleText) {
        warnings.push(
          `${context}: ${zc.zone} @ row ${r + 1} used embedded rule "${price.ruleText}"`,
        )
      }
      const range = price.range ?? { from: weightFrom, to: weightTo }
      slabs.push({
        zone: zc.zone,
        weight_from: range.from,
        weight_to: range.to,
        slab_type: price.slabTypeOverride ?? slabType,
        price: price.value,
      })
    }
    if (w.to !== OPEN_ENDED_WEIGHT) prevTo = w.to
  }
  return slabs
}

export interface WeightBandSpec {
  col: number
  weight_from: number
  weight_to: number
  slab_type: SlabType
}

/**
 * Destination-rows × weight-band-columns extraction (archetype B). Each row
 * is a destination; the caller supplies the (fixed) band→column mapping
 * since it varies per sub-table.
 */
export function extractDestinationRowSlabs(
  sheet: ParsedSheet,
  opts: {
    firstDataRow: number
    lastDataRow: number
    destCol: number
    bands: WeightBandSpec[]
    zone?: string
  },
  warnings: string[],
  context: string,
): Map<string, RateSlab[]> {
  const byDest = new Map<string, RateSlab[]>()
  for (let r = opts.firstDataRow; r <= opts.lastDataRow; r++) {
    const dest = text(sheet.rows[r]?.[opts.destCol])
    if (dest === '') continue
    const slabs: RateSlab[] = []
    for (const band of opts.bands) {
      const { price, skipReason } = parsePriceCell(sheet.rows[r]?.[band.col])
      if (skipReason) {
        if (skipReason !== 'not available') {
          warnings.push(`${context}: ${dest} @ row ${r + 1} skipped (${skipReason})`)
        }
        continue
      }
      if (!price) continue
      if (price.ruleText) {
        warnings.push(`${context}: ${dest} @ row ${r + 1} used embedded rule "${price.ruleText}"`)
      }
      const range = price.range ?? { from: band.weight_from, to: band.weight_to }
      slabs.push({
        zone: opts.zone ?? dest,
        weight_from: range.from,
        weight_to: range.to,
        slab_type: price.slabTypeOverride ?? band.slab_type,
        price: price.value,
      })
    }
    if (slabs.length > 0) byDest.set(dest, slabs)
  }
  return byDest
}

/** Reads a stacked "column = zone, rows below = member states/codes" block (ragged). */
export function extractColumnMemberList(
  sheet: ParsedSheet,
  opts: { col: number; firstRow: number; lastRow: number },
): string[] {
  const out: string[] = []
  for (let r = opts.firstRow; r <= opts.lastRow; r++) {
    const t = text(sheet.rows[r]?.[opts.col])
    if (t !== '') out.push(t)
  }
  return out
}
