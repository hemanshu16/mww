// Domain types for the courier rate-sheet import wizard.
//
// Two families live here:
//  1. The *parsed workbook* — the raw grid we read from an uploaded .xlsx.
//  2. The *generic JSON contract* — the canonical, provider-agnostic output the
//     wizard produces. This mirrors the backend's service / rate_slab / zone_rule
//     model so the same shape can later be POSTed and stored verbatim.

// ---------------------------------------------------------------------------
// 1. Parsed workbook (raw grid)
// ---------------------------------------------------------------------------

/** A single cell's value, normalized. `null` = empty cell. */
export type CellValue = string | number | boolean | null

export interface ParsedSheet {
  name: string
  /** Row-major grid. rows[r][c]. Ragged rows are padded to `cols`. */
  rows: CellValue[][]
  /** Widest row, so the grid renders as a rectangle. */
  cols: number
}

export interface ParsedWorkbook {
  fileName: string
  sha256: string
  sheets: ParsedSheet[]
}

// ---------------------------------------------------------------------------
// 2. Generic JSON contract (wizard output)
// ---------------------------------------------------------------------------

export type PriceVariant = 'GST' | 'CASH'
export type SlabType = 'total' | 'per_kg' | 'per_box'
export type MatchType =
  'postcode_exact' | 'postcode_range' | 'zip_prefix' | 'state' | 'fsa_prefix' | 'country'
export type PricingMode = 'zoned' | 'flat'

/** A destination: either a single ISO country or a named group/region. */
export type Destination = { type: 'country'; iso2: string } | { type: 'group'; name: string }

export interface RateSlab {
  zone: string
  weight_from: number
  weight_to: number
  slab_type: SlabType
  price: number
  /** FedEx doc vs package; null/absent otherwise. */
  doc_type?: 'doc' | 'package'
}

export interface ZoneRule {
  lo: string
  hi: string | null
  zone: string
  is_remote: boolean
}

export interface ZoneMap {
  ref: string
  match_type: MatchType
  rules: ZoneRule[]
}

export interface ServiceExport {
  code: string
  dest: Destination
  gateway?: string | null
  duty?: 'DDP' | 'DDU' | null
  service_level?: string | null
  volumetric_divisor?: number | null
  transit_time?: string | null
  per_box_max_kg?: number | null
  min_weight_kg?: number | null
  pricing_mode: PricingMode
  /** References a ZoneMap.ref when pricing_mode = 'zoned'; null for 'flat'. */
  zone_map_ref?: string | null
  slabs: RateSlab[]
  /**
   * Free-text billing/policy rules that don't fit a structured field yet
   * (AWB fees, address-correction charges, embedded per-kg rules, piece
   * limits, "temporarily closed" exclusions, etc). Never silently dropped —
   * anything we can't confidently structure lands here instead of being
   * guessed into a numeric field.
   */
  notes?: string[]
}

/** The full generic JSON emitted per uploaded file. */
export interface RateSheetExport {
  provider: string
  price_variant: PriceVariant
  currency: string
  effective_from: string | null
  source_file: string
  source_sha256: string
  generated_at: string
  services: ServiceExport[]
  zone_maps: ZoneMap[]
  /** Anything the parser skipped or couldn't confidently structure — for human review before promotion. */
  warnings: string[]
}

// ---------------------------------------------------------------------------
// 3. Per-sheet mapping (the wizard's working state)
// ---------------------------------------------------------------------------
//
// A single worksheet can contain a rate table, a zone map, or BOTH side by side
// (e.g. Skynet AUS-SAVER). So a sheet mapping holds up to two independent
// regions, each auto-detected and separately editable.

/** How confident auto-detection is about a region. */
export type Confidence = 'high' | 'low' | 'none'

/** A rate table: weight rows × zone columns, with a two-regime slab break. */
export interface RatesRegion {
  headerRow: number
  firstDataRow: number
  lastDataRow: number
  weightCol: number
  /** Price columns; each carries the zone label read from its header cell. */
  zoneCols: { col: number; zone: string }[]
  /** First data row priced per-kg/per-box (weights above the break). null = all `total`. */
  slabBreakRow: number | null
  slabBreakType: 'per_kg' | 'per_box'
  pricingMode: PricingMode
}

/** A pincode→zone map. `pairs` supports the wide multi-pair layout. */
export interface ZoneMapPair {
  loCol: number
  hiCol: number | null
  zoneCol: number
}
export interface ZoneMapRegion {
  headerRow: number
  firstDataRow: number
  lastDataRow: number
  matchType: MatchType
  pairs: ZoneMapPair[]
  remoteCol: number | null
}

export interface SheetMapping {
  sheetIndex: number
  /** false → the sheet is ignored (index / T&C / contacts). */
  include: boolean
  rates: RatesRegion | null
  zoneMap: ZoneMapRegion | null
  /** Whether the current mapping came from auto-detect vs a manual edit. */
  detected: boolean
  confidence: Confidence
}
