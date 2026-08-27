// Dedicated parser for ACX ("Shree Shakti" self-network) rate sheets.
//
// Unlike the generic auto-detect wizard (detect.ts), this hard-codes WHERE
// each service and zone map lives in a *known* ACX workbook layout — sheet
// names, row/col positions — because ACX's file mixes so many distinct
// archetypes (see the analysis this module was built from) that generic
// detection can't reliably separate them. Trade-off: this parser breaks if
// ACX changes its layout; the payoff is a correct, complete extraction today.
//
// Design rule carried over from the spec: never guess. Anything we can't
// confidently turn into a number (a "TEMPORARILY CLOSED" lane, a compound
// surcharge formula, an increment-rate column) is either skipped with a
// warning or captured as a free-text note — never silently dropped, never
// fabricated into a price.

import {
  extractColumnMemberList,
  extractDestinationRowSlabs,
  extractWeightZoneSlabs,
  OPEN_ENDED_WEIGHT,
  type ZoneColSpec,
} from './shared'
import type {
  CellValue,
  Destination,
  ParsedSheet,
  ParsedWorkbook,
  RateSheetExport,
  RateSlab,
  ServiceExport,
  SlabType,
  ZoneMap,
  ZoneRule,
} from '../types'

function text(v: CellValue): string {
  return v === null ? '' : String(v).trim()
}

/**
 * Reads a numeric cell. Also accepts a leading number in text (ACX writes
 * some prices as "1450 PKG"), noting the original text as a warning so the
 * admin can confirm "PKG" doesn't change the number's meaning. Truly
 * unparseable values warn and return null; blank cells are silent.
 */
function numOrWarn(v: CellValue, warnings: string[], context: string): number | null {
  if (typeof v === 'number') return v
  const t = text(v)
  if (t === '') return null
  const m = t.match(/^-?\d+(\.\d+)?/)
  if (m) {
    if (t !== m[0]) warnings.push(`${context}: read ${m[0]} from "${t}"`)
    return Number(m[0])
  }
  warnings.push(`${context}: skipped non-numeric value "${t}"`)
  return null
}

function sheet(wb: ParsedWorkbook, name: string): ParsedSheet {
  const s = wb.sheets.find((s) => s.name.trim() === name.trim())
  if (!s) throw new Error(`ACX parser: expected sheet "${name}" not found`)
  return s
}

function svc(base: Partial<ServiceExport> & Pick<ServiceExport, 'code' | 'dest'>): ServiceExport {
  return {
    gateway: null,
    duty: null,
    service_level: null,
    volumetric_divisor: null,
    transit_time: null,
    per_box_max_kg: null,
    min_weight_kg: null,
    pricing_mode: 'flat',
    zone_map_ref: null,
    slabs: [],
    notes: [],
    ...base,
  }
}

const country = (iso2: string): Destination => ({ type: 'country', iso2 })

// ---------------------------------------------------------------------------
// Zone maps
// ---------------------------------------------------------------------------

/** AU postcode -> zone, deduped, with is_remote merged in from the remote list. */
function buildAuZoneMap(wb: ParsedWorkbook, warnings: string[]): ZoneMap {
  const zoneSheet = sheet(wb, 'AUS ZONE LIST')
  const remoteSheet = sheet(wb, 'AUS REMOTE ZONE LIST')

  const byPostcode = new Map<string, string>()
  const conflicts = new Set<string>()
  // header at row index 1 (r2): Pcode | Locality | State | zonelist
  for (let r = 2; r < zoneSheet.rows.length; r++) {
    const pcode = text(zoneSheet.rows[r][0])
    const zone = text(zoneSheet.rows[r][3])
    if (pcode === '' || zone === '') continue
    const existing = byPostcode.get(pcode)
    if (existing && existing !== zone) conflicts.add(pcode)
    byPostcode.set(pcode, zone)
  }
  if (conflicts.size > 0) {
    warnings.push(
      `AU zone map: ${conflicts.size} postcodes had conflicting zones across localities; kept the last seen`,
    )
  }

  const remotePostcodes = new Set<string>()
  // header at row index 1 (r2): PostCode | Suburb | State
  for (let r = 2; r < remoteSheet.rows.length; r++) {
    const pcode = text(remoteSheet.rows[r][0])
    if (pcode !== '') remotePostcodes.add(pcode)
  }

  const rules: ZoneRule[] = Array.from(byPostcode.entries()).map(([lo, zone]) => ({
    lo,
    hi: null,
    zone,
    is_remote: remotePostcodes.has(lo),
  }))
  return { ref: 'ACX_AU_ZONE', match_type: 'postcode_exact', rules }
}

/** NZ pincode -> zone (Zone Guide sheet's column order is State,Suburb,Pincode,Zone). */
function buildNzZoneMap(wb: ParsedWorkbook, warnings: string[]): ZoneMap {
  const s = sheet(wb, 'NZ ZONE LIST')
  const byPincode = new Map<string, string>()
  const conflicts = new Set<string>()
  // header row index 1 (r2): STATE | SUBURB | PINCODE | ZONE
  for (let r = 2; r < s.rows.length; r++) {
    const pincode = text(s.rows[r][2])
    const zone = text(s.rows[r][3])
    if (pincode === '' || zone === '') continue
    const existing = byPincode.get(pincode)
    if (existing && existing !== zone) conflicts.add(pincode)
    byPincode.set(pincode, zone)
  }
  if (conflicts.size > 0) {
    warnings.push(
      `NZ zone map: ${conflicts.size} pincodes had conflicting zones; kept the last seen`,
    )
  }
  const rules: ZoneRule[] = Array.from(byPincode.entries()).map(([lo, zone]) => ({
    lo,
    hi: null,
    zone,
    is_remote: false,
  }))
  return { ref: 'ACX_NZ_ZONE', match_type: 'postcode_exact', rules }
}

/**
 * Canada: "CANADA ZONE 1 LIST" is a whitelist of FSAs that are Zone 1 —
 * every other FSA is "REST OF CANADA". There's no schema concept of a
 * catch-all rule, so we encode it as an explicit lowest-priority wildcard
 * (lo: '*') and document the convention here for whoever builds the
 * zone-resolver: an unmatched FSA should fall through to this rule.
 */
function buildCanadaZoneMap(wb: ParsedWorkbook): ZoneMap {
  const s = sheet(wb, 'CANADA ZONE 1 LIST')
  const rules: ZoneRule[] = []
  const seen = new Set<string>()
  // header row index 1 (r2): zip starting from | city_or_town | region | province
  for (let r = 2; r < s.rows.length; r++) {
    const fsa = text(s.rows[r][0])
    if (fsa === '' || seen.has(fsa)) continue
    seen.add(fsa)
    rules.push({ lo: fsa, hi: null, zone: 'CANADA DDP ZONE 1', is_remote: false })
  }
  rules.push({ lo: '*', hi: null, zone: 'REST OF CANADA', is_remote: false })
  return { ref: 'ACX_CANADA_ZONE1', match_type: 'fsa_prefix', rules }
}

/**
 * USA: the state->zone map lives INSIDE the rate sheet itself, side by side
 * with the rates (a stacked "column = zone, rows = member states" block).
 */
function buildUsaZoneMap(wb: ParsedWorkbook): ZoneMap {
  const s = sheet(wb, 'ACX USA SELF DDP')
  const zoneLabelsRow = 4 // r5: header row
  const rules: ZoneRule[] = []
  // state block occupies cols J..P (9..15), data rows 5..13 (r6..r14), ragged
  for (let col = 9; col <= 15; col++) {
    const zone = text(s.rows[zoneLabelsRow][col])
    if (zone === '') continue
    const states = extractColumnMemberList(s, { col, firstRow: 5, lastRow: 13 })
    for (const st of states) rules.push({ lo: st, hi: null, zone, is_remote: false })
  }
  return { ref: 'ACX_USA_STATE', match_type: 'state', rules }
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

const USA_NOTES = [
  'Multiple packets: each packet must be 15kg+, otherwise the 20+ slab rate applies to the whole shipment',
  'AWB fee Rs. 100/AWB',
  'Bulk/commercial/valuable content: +Rs.100/kg duty',
  'Rates ex-Ahmedabad',
  'Address correction charge Rs.3000',
  'Chargeable weight = max(actual, volumetric); volumetric = L*B*H / 5000 per box',
  'Cutoff 17:00 IST',
  'Extra USD 25 above 22kg; extra USD 150 above 30kg',
  'Return shipments: extra charges on actuals billed to shipper',
  'Invoice must be in USD, under 100 USD',
  'Max AWB weight 100kg',
  'Medicines not allowed',
]

function parseUsa(wb: ParsedWorkbook, warnings: string[]): ServiceExport {
  const s = sheet(wb, 'ACX USA SELF DDP')
  const zoneCols: ZoneColSpec[] = [1, 2, 3, 4, 5, 6, 7].map((col) => ({
    col,
    zone: text(s.rows[4][col]),
  }))
  const ctx = 'ACX USA SELF DDP'
  const slabs = extractWeightZoneSlabs(
    s,
    {
      firstDataRow: 5,
      lastDataRow: 27,
      weightCol: 0,
      zoneCols,
      slabTypeAt: (w) => (w < 6 ? 'total' : 'per_kg'),
    },
    warnings,
    ctx,
  )
  return svc({
    code: 'ACX_USA_SELF_DDP',
    dest: country('US'),
    duty: 'DDP',
    service_level: 'Self',
    volumetric_divisor: 5000,
    per_box_max_kg: 100,
    pricing_mode: 'zoned',
    zone_map_ref: 'ACX_USA_STATE',
    slabs,
    notes: USA_NOTES,
  })
}

const AU_COMMON_NOTES = [
  'AWB charges 50 INR',
  'One piece above 25kg not allowed; +9000 INR if 25-30kg',
  'Multiple pieces not allowed above 50kg total',
  'Daily flights',
  'Medicines allowed with original bill/prescription, +1500 INR/kg',
]

function parseAustralia(wb: ParsedWorkbook, warnings: string[]): ServiceExport[] {
  const s = sheet(wb, 'ACX SELF AUSTRALIA')
  const ctx = 'ACX SELF AUSTRALIA'
  const perKg: SlabType = 'per_kg' // note: "ABOVE RATES ARE PER KG RATES" — stated explicitly, not inferred
  const express = extractWeightZoneSlabs(
    s,
    {
      firstDataRow: 4,
      lastDataRow: 28,
      weightCol: 0,
      zoneCols: [1, 2, 3, 4, 5, 6].map((col) => ({ col, zone: text(s.rows[3][col]) })),
      slabTypeAt: () => perKg,
    },
    warnings,
    `${ctx} EXPRESS`,
  )
  const economy = extractWeightZoneSlabs(
    s,
    {
      firstDataRow: 4,
      lastDataRow: 28,
      weightCol: 8,
      zoneCols: [9, 10, 11, 12, 13, 14].map((col) => ({ col, zone: text(s.rows[3][col]) })),
      slabTypeAt: () => perKg,
    },
    warnings,
    `${ctx} ECONOMY`,
  )
  const base = {
    dest: country('AU'),
    pricing_mode: 'zoned' as const,
    zone_map_ref: 'ACX_AU_ZONE',
    notes: AU_COMMON_NOTES,
  }
  return [
    svc({ ...base, code: 'ACX_AU_SELF_EXPRESS', service_level: 'Express', slabs: express }),
    svc({
      ...base,
      code: 'ACX_AU_SELF_ECONOMY',
      service_level: 'Economy',
      slabs: economy,
      notes: [...AU_COMMON_NOTES, 'Liquids/semi-liquids not allowed in Economy mode'],
    }),
  ]
}

function parseNewZealand(wb: ParsedWorkbook, warnings: string[]): ServiceExport[] {
  const s = sheet(wb, 'ACX SELF NEWZEALAND')
  const ctx = 'ACX SELF NEWZEALAND'
  const perKg: SlabType = 'per_kg' // stated explicitly
  const express = extractWeightZoneSlabs(
    s,
    {
      firstDataRow: 4,
      lastDataRow: 28,
      weightCol: 0,
      zoneCols: [1, 2, 3, 4].map((col) => ({ col, zone: text(s.rows[3][col]) })),
      slabTypeAt: () => perKg,
    },
    warnings,
    `${ctx} EXPRESS`,
  )
  const economy = extractWeightZoneSlabs(
    s,
    {
      firstDataRow: 4,
      lastDataRow: 28,
      weightCol: 6,
      zoneCols: [7, 8, 9].map((col) => ({ col, zone: text(s.rows[3][col]) })),
      slabTypeAt: () => perKg,
    },
    warnings,
    `${ctx} ECONOMY`,
  )
  const notes = [
    'AWB charges 50 INR',
    'One piece above 25kg not allowed; +9000 INR if 25-30kg',
    'Multiple pieces not allowed above 50kg total',
    'Medicines allowed with original bill/prescription, +1500 INR/kg',
    'Zone label "ZONE 3/4" is a merged zone as published by ACX, not a parsing artifact',
  ]
  const base = {
    dest: country('NZ'),
    pricing_mode: 'zoned' as const,
    zone_map_ref: 'ACX_NZ_ZONE',
    notes,
  }
  return [
    svc({ ...base, code: 'ACX_NZ_SELF_EXPRESS', service_level: 'Express', slabs: express }),
    svc({ ...base, code: 'ACX_NZ_SELF_ECONOMY', service_level: 'Economy', slabs: economy }),
  ]
}

const CANADA_NOTES = [
  'One piece above 25kg not allowed; +5000 INR if 25-30kg',
  'Multiple pieces allowed up to 50kg total',
  '2500 INR/box extra for odd-dimension boxes',
  '2500 INR extra for cricket bat/kit',
  'Invoice value must be below 100 CAD',
  'Daily flights',
  'Medicines / ghee / PO box addresses not allowed',
  'FBA shipments allowed with +100 INR/kg surcharge',
  'AWB charges 50 INR',
  'Pricing regime inferred as per-kg throughout (no explicit total-price tier stated, unlike USA DDP) — verify before promoting',
]

function parseCanada(
  wb: ParsedWorkbook,
  sheetName: string,
  codePrefix: string,
  warnings: string[],
): ServiceExport[] {
  const s = sheet(wb, sheetName)
  const perKg: SlabType = 'per_kg'
  const ddp = extractWeightZoneSlabs(
    s,
    {
      firstDataRow: 4,
      lastDataRow: 28,
      weightCol: 0,
      zoneCols: [
        { col: 1, zone: 'CANADA DDP ZONE 1' },
        { col: 2, zone: 'REST OF CANADA' },
      ],
      slabTypeAt: () => perKg,
    },
    warnings,
    `${sheetName} DDP`,
  )
  const ndp = extractWeightZoneSlabs(
    s,
    {
      firstDataRow: 4,
      lastDataRow: 28,
      // note: there's a blank spacer column (index 3) between the DDP and NDP blocks
      weightCol: 4,
      zoneCols: [
        { col: 5, zone: 'CANADA DDP ZONE 1' },
        { col: 6, zone: 'REST OF CANADA' },
      ],
      slabTypeAt: () => perKg,
    },
    warnings,
    `${sheetName} NDP`,
  )
  const base = {
    dest: country('CA'),
    pricing_mode: 'zoned' as const,
    zone_map_ref: 'ACX_CANADA_ZONE1',
    notes: CANADA_NOTES,
  }
  return [
    svc({ ...base, code: `${codePrefix}_DDP`, duty: 'DDP', slabs: ddp }),
    svc({ ...base, code: `${codePrefix}_NDP`, duty: 'DDU', slabs: ndp }),
  ]
}

const UK_HANDLING_NOTES = [
  'One piece above 30kg not allowed (30-250kg routed to UK_SELF_GATWICK heavy-shipment pricing — see ACX_UK_HEAVY_SHIPMENT)',
  'GBP 35 handling if any dimension above 100cm',
  'GBP 35 handling if any piece above 30kg',
  'GBP 35 handling for wooden packaging',
  'GBP 35 handling for pipe-shaped/odd-dimension pieces regardless of weight',
  '50% volume discount applicable; +50 INR docket charge',
  'Medicines allowed with original bill/prescription, +1500 INR/kg',
  'AWB charges 50 INR',
  'Pricing regime inferred as per-kg throughout — verify before promoting',
]

function parseUk(wb: ParsedWorkbook, warnings: string[]): ServiceExport[] {
  const s = sheet(wb, 'ACX SELF UK')
  const perKg: SlabType = 'per_kg'
  const flatLane = (weightCol: number, rateCol: number, label: string) =>
    extractWeightZoneSlabs(
      s,
      {
        firstDataRow: 6,
        lastDataRow: 14,
        weightCol,
        zoneCols: [{ col: rateCol, zone: label }],
        slabTypeAt: () => perKg,
      },
      warnings,
      `ACX SELF UK ${label}`,
    )
  const thai = flatLane(0, 1, 'UK_THAI')
  const airIndia = flatLane(3, 4, 'UK_AIRINDIA')
  const economy = flatLane(6, 7, 'UK_ECONOMY')

  // UK_OTHERS ("Scotland & UK Others"): a small hand-rolled weight-band ladder,
  // not a repeating pattern elsewhere — cheaper to write directly than to
  // generalize the shared helper for one table.
  const othersBands: { row: number; from: number; to: number; type: SlabType }[] = [
    { row: 7, from: 0, to: 0.5, type: 'total' }, // 500 Gms
    { row: 8, from: 0.5, to: 1, type: 'total' }, // Addl 500 Gms (treated as the 0.5-1kg total)
    { row: 9, from: 1, to: 6, type: 'total' }, // 6kg++
    { row: 10, from: 6, to: 8, type: 'total' }, // 8kg++
    { row: 11, from: 8, to: 11, type: 'total' }, // 11Kg++
    { row: 12, from: 11, to: 16, type: 'total' }, // 16Kg++
    { row: 13, from: 16, to: 21, type: 'total' }, // 21Kg++
    { row: 14, from: 21, to: 26, type: 'total' }, // 26Kg++
  ]
  const othersSlabs: RateSlab[] = []
  for (const b of othersBands) {
    const cell = s.rows[b.row]?.[10]
    if (typeof cell === 'number') {
      othersSlabs.push({
        zone: 'UK_OTHERS',
        weight_from: b.from,
        weight_to: b.to,
        slab_type: b.type,
        price: cell,
      })
    }
  }

  const notes = UK_HANDLING_NOTES
  const base = { dest: country('GB'), pricing_mode: 'flat' as const, notes }

  return [
    svc({ ...base, code: 'ACX_UK_THAI', service_level: 'Thai Airways', slabs: thai }),
    svc({ ...base, code: 'ACX_UK_AIRINDIA', service_level: 'Air India', slabs: airIndia }),
    svc({ ...base, code: 'ACX_UK_ECONOMY', service_level: 'Economy', slabs: economy }),
    svc({
      ...base,
      code: 'ACX_UK_OTHERS',
      service_level: 'Scotland & UK Others',
      slabs: othersSlabs,
      notes: [...notes, 'Clearance charges GBP 2500 extra'],
    }),
    svc({
      ...base,
      code: 'ACX_UK_HEAVY_SHIPMENT',
      service_level: 'Gatwick heavy shipment (30-250kg)',
      slabs: [],
      notes: [
        'Compound formula, not a flat rate — not auto-extracted:',
        '30-40kg: 495/pkg + GBP 150',
        '40-100kg: 495/pkg + GBP 250',
        '100-300kg: 495/pkg + GBP 350',
        '300kg+: 495/pkg + GBP 450',
        ...notes,
      ],
    }),
  ]
}

const EUROPE_COUNTRIES: [string, string][] = [
  ['GERMANY', 'DE'],
  ['AUSTRIA', 'AT'],
  ['BELGIUM', 'BE'],
  ['LEXEMBOURG', 'LU'],
  ['NETHERLANDS', 'NL'],
  ['DENMARK', 'DK'],
  ['FRANCE', 'FR'],
  ['CZECH REPUBLIC', 'CZ'],
  ['ITALY', 'IT'],
  ['POLAND', 'PL'],
  ['SLOVAKIA', 'SK'],
  ['SLOVENIA', 'SI'],
  ['IRELAND', 'IE'],
  ['PORTUGAL', 'PT'],
  ['SPAIN', 'ES'],
  ['SWEDEN', 'SE'],
  ['ESTONIA', 'EE'],
  ['FINLAND', 'FI'],
  ['LATVIA', 'LV'],
  ['LITHUANIA', 'LT'],
  ['MONACO', 'MC'],
  ['BULGARIA', 'BG'],
  ['ROMANIA', 'RO'],
  ['NORWAY', 'NO'],
  ['SWITZERLAND', 'CH'],
  ['GREECE', 'GR'],
  ['CROATIA', 'HR'],
  ['HUNGARY', 'HU'],
]

function parseEurope(
  wb: ParsedWorkbook,
  sheetName: string,
  codePrefix: string,
  serviceLevel: string,
  warnings: string[],
): ServiceExport[] {
  const s = sheet(wb, sheetName)
  const perKg: SlabType = 'per_kg'
  const notes = [
    'One piece above 30kg not allowed',
    'Single pc, single AWB',
    'Medicines allowed with original bill/prescription',
    'AWB charges 50 INR',
    '"NA" cells mean the destination has no published rate at that weight, not a zero price',
    'Pricing regime inferred as per-kg throughout — verify before promoting',
  ]
  // One country per column; each is priced end-to-end with no zone-resolution
  // step needed, so each becomes its own flat, single-country service.
  return EUROPE_COUNTRIES.map(([_name, iso2], i) => {
    const col = i + 1
    const slabs = extractWeightZoneSlabs(
      s,
      {
        firstDataRow: 3,
        lastDataRow: 32,
        weightCol: 0,
        zoneCols: [{ col, zone: iso2 }],
        slabTypeAt: () => perKg,
      },
      warnings,
      `${sheetName} ${iso2}`,
    )
    return svc({
      code: `${codePrefix}_${iso2}`,
      dest: country(iso2),
      service_level: serviceLevel,
      pricing_mode: 'flat',
      slabs,
      notes,
    })
  })
}

const EX_MUMBAI_DESTS: { col: number; label: string; iso2: string; gateway?: string }[] = [
  { col: 1, label: 'DUBAI', iso2: 'AE' },
  { col: 2, label: 'OMAN', iso2: 'OM' },
  { col: 3, label: 'QATAR', iso2: 'QA' },
  { col: 4, label: 'SAUDI ARABIA', iso2: 'SA' },
  { col: 5, label: 'IRAN', iso2: 'IR' },
  { col: 6, label: 'SINGAPORE', iso2: 'SG' },
  { col: 7, label: 'MALAYSIA (Duty Paid)', iso2: 'MY', gateway: 'Duty Paid' },
  {
    col: 8,
    label: 'MALAYSIA (Remote - Sabah/Sarawak/Langkawi)',
    iso2: 'MY',
    gateway: 'Remote - Sabah/Sarawak/Langkawi',
  },
  { col: 9, label: 'NEPAL (Kathmandu)', iso2: 'NP', gateway: 'Kathmandu' },
  { col: 10, label: 'Rest of Nepal', iso2: 'NP', gateway: 'Rest of Nepal' },
]

function parseExMumbai(wb: ParsedWorkbook, warnings: string[]): ServiceExport[] {
  const s = sheet(wb, 'EX MUMBAI AW')
  const ctx = 'EX MUMBAI AW'
  const notes = [
    'Effective 01.07.2026 (differs from the file-level 03.08.2026 date)',
    'AWB charges 50 INR',
    'Qatar: shipper KYC + colour Qatar ID of consignee mandatory',
    'Saudi Arabia: consignee IQAMA (individual, max 10kg) or CR copy (company) mandatory',
  ]
  return EX_MUMBAI_DESTS.map(({ col, label, iso2, gateway }) => {
    const slabs = extractWeightZoneSlabs(
      s,
      {
        firstDataRow: 3,
        lastDataRow: 13,
        weightCol: 0,
        zoneCols: [{ col, zone: label }],
        slabTypeAt: (w) => (w < 6 ? 'total' : 'per_kg'),
      },
      warnings,
      `${ctx} ${label}`,
    )
    return svc({
      code: `ACX_EXMUM_${iso2}${gateway ? '_' + gateway.replace(/[^A-Z0-9]+/gi, '_').toUpperCase() : ''}`,
      dest: country(iso2),
      gateway: gateway ?? null,
      pricing_mode: 'flat',
      slabs,
      notes,
    })
  })
}

function parseAfrica(wb: ParsedWorkbook, warnings: string[]): ServiceExport[] {
  const s = sheet(wb, 'ACX AFRICA')
  const bands = [
    { col: 2, weight_from: 0, weight_to: 0.5, slab_type: 'total' as SlabType },
    { col: 4, weight_from: 0.5, weight_to: 6, slab_type: 'total' as SlabType },
    { col: 5, weight_from: 6, weight_to: 11, slab_type: 'total' as SlabType },
    { col: 6, weight_from: 11, weight_to: 20, slab_type: 'total' as SlabType },
  ]
  // "Addl 500 Gms" (col 3) is an *increment* rate (added per extra 500g), not
  // a slab boundary — the RateSlab schema can't express that, so it's a note.
  const byDest = extractDestinationRowSlabs(
    s,
    { firstDataRow: 4, lastDataRow: 17, destCol: 1, bands },
    warnings,
    'ACX AFRICA',
  )
  const generalNotes = [
    'Max 2 boxes per AWB; single box max 30kg',
    'Weights rounded up per box',
    'Loss liability: USD 100 or declared invoice value, whichever is lower',
    '"Addl 500 Gms" column not extracted (per-increment rate, not a slab boundary) — see raw column D',
  ]
  const destMeta: Record<
    string,
    { iso2: string; gateway?: string; duty: 'DDP' | null; rawService: string; addl500: string }
  > = {
    'Zambia(Lusaka Duty Paid)': {
      iso2: 'ZM',
      gateway: 'Lusaka',
      duty: 'DDP',
      rawService: 'ACX EX MUM DDP',
      addl500: '550',
    },
    'Zambia(Others Duty Paid)': {
      iso2: 'ZM',
      gateway: 'Others',
      duty: 'DDP',
      rawService: 'ACX EX MUM DDP',
      addl500: '650',
    },
    Malawi: { iso2: 'MW', duty: null, rawService: 'ACX EX MUM', addl500: '550' },
    'Kenya DDU(No Receipt)': { iso2: 'KE', duty: null, rawService: 'ACX EX MUM', addl500: '' },
    'Kenya(Duty Paid)': { iso2: 'KE', duty: 'DDP', rawService: 'ACX EX MUM DDP', addl500: '' },
    Nigeria: { iso2: 'NG', duty: null, rawService: 'ACX EX MUM', addl500: '650' },
    'Nigeria (Duty Paid)': {
      iso2: 'NG',
      duty: 'DDP',
      rawService: 'ACX EX MUM DDP',
      addl500: '750',
    },
    Tanzania: { iso2: 'TZ', duty: null, rawService: 'ACX EX MUM', addl500: '550' },
    'Tanzania (Duty Paid)': {
      iso2: 'TZ',
      duty: 'DDP',
      rawService: 'ACX EX MUM DDP',
      addl500: '650',
    },
    Zimbabwe: { iso2: 'ZW', duty: null, rawService: 'ACX EX MUM', addl500: '600' },
    'Zimbabwe (Dutypaid)': {
      iso2: 'ZW',
      duty: 'DDP',
      rawService: 'ACX EX MUM DDP',
      addl500: '950',
    },
    'UGANDA (Dutypaid)': { iso2: 'UG', duty: 'DDP', rawService: 'ACX EX MUM DDP', addl500: '600' },
    MAURITIUS: { iso2: 'MU', duty: null, rawService: 'ACX EX MUM', addl500: '550' },
  }

  const out: ServiceExport[] = []
  for (const [dest, slabs] of byDest) {
    const meta = destMeta[dest]
    if (!meta) {
      warnings.push(`ACX AFRICA: no ISO2 mapping for destination label "${dest}" — service skipped`)
      continue
    }
    // Kenya rows use an embedded "1kg-5kg : X/Kg" rule in the 500g column,
    // already captured as a per_kg slab by the shared helper (with a warning).
    out.push(
      svc({
        code: `ACX_EXMUM_AFRICA_${meta.iso2}${
          meta.gateway ? '_' + meta.gateway.toUpperCase() : meta.duty === 'DDP' ? '_DDP' : ''
        }`,
        dest: country(meta.iso2),
        gateway: meta.gateway ?? null,
        duty: meta.duty,
        per_box_max_kg: 30,
        pricing_mode: 'flat',
        slabs,
        notes: meta.addl500
          ? [...generalNotes, `Addl 500 Gms increment: ${meta.addl500} INR per extra 500g`]
          : generalNotes,
      }),
    )
  }
  return out
}

function parseDubaiMideastFarEast(wb: ParsedWorkbook, warnings: string[]): ServiceExport[] {
  const s = sheet(wb, ' DUBAI-MID & FAR EAST-CHINA-HKG')
  const out: ServiceExport[] = []
  const notes50Awb = [
    'AWB charges 50 INR',
    'Multiple pieces not allowed',
    'One piece above 30kg not allowed',
  ]

  // ACX DUBAI SELF: single flat per-kg rate, min 10kg, no weight ladder.
  out.push(
    svc({
      code: 'ACX_DUBAI_SELF',
      dest: country('AE'),
      pricing_mode: 'flat',
      min_weight_kg: 10,
      slabs: [
        {
          zone: 'DUBAI',
          weight_from: 10,
          weight_to: OPEN_ENDED_WEIGHT,
          slab_type: 'per_kg',
          price: 290,
        },
      ],
      notes: ['Daily Emirates flights ex-Ahmedabad', ...notes50Awb],
    }),
  )

  // ACX MIDDLE EAST SELF: 2 weight bands (06-10, 11-30) x 5 countries.
  const meCountries: [string, number][] = [
    ['BH', 8],
    ['OM', 9],
    ['KW', 10],
    ['QA', 11],
    ['SA', 12],
  ]
  for (const [iso2, col] of meCountries) {
    const ctx = `ACX MIDDLE EAST SELF ${iso2}`
    const p1 = numOrWarn(s.rows[3]?.[col], warnings, ctx)
    const p2 = numOrWarn(s.rows[4]?.[col], warnings, ctx)
    const slabs: RateSlab[] = []
    if (p1 !== null)
      slabs.push({ zone: iso2, weight_from: 6, weight_to: 11, slab_type: 'per_kg', price: p1 })
    if (p2 !== null)
      slabs.push({ zone: iso2, weight_from: 11, weight_to: 31, slab_type: 'per_kg', price: p2 })
    out.push(
      svc({
        code: `ACX_MIDEAST_${iso2}`,
        dest: country(iso2),
        min_weight_kg: 6,
        pricing_mode: 'flat',
        slabs,
        notes: [
          iso2 === 'QA' ? 'Qatar: shipper KYC + colour Qatar ID of consignee mandatory' : '',
          iso2 === 'SA'
            ? 'Saudi Arabia: consignee IQAMA (individual, max 10kg) or CR copy (company) mandatory'
            : '',
          ...notes50Awb,
        ].filter(Boolean),
      }),
    )
  }

  // ACX SELF CHINA / HONG KONG: weight-band rows x 2 countries.
  const chBands: { row: number; from: number; to: number }[] = [
    { row: 3, from: 0, to: 0.5 },
    { row: 4, from: 0.5, to: 6 },
    { row: 5, from: 6, to: 8 },
    { row: 6, from: 8, to: 11 },
    { row: 7, from: 11, to: 16 },
    { row: 8, from: 16, to: 22 },
    { row: 9, from: 22, to: 44 },
  ]
  for (const [iso2, col] of [
    ['CN', 15],
    ['HK', 16],
  ] as const) {
    const slabs: RateSlab[] = []
    for (const b of chBands) {
      const v = numOrWarn(s.rows[b.row]?.[col], warnings, `ACX SELF CHINA/HK ${iso2}`)
      if (v !== null)
        slabs.push({
          zone: iso2,
          weight_from: b.from,
          weight_to: b.to,
          slab_type: 'total',
          price: v,
        })
    }
    out.push(
      svc({
        code: `ACX_${iso2}_SELF`,
        dest: country(iso2),
        pricing_mode: 'flat',
        slabs,
        notes: [
          'Non-food rates only',
          'Duties & tax applicable (billed at actuals)',
          'Transit ~6-7 days, subject to flights/customs',
        ],
      }),
    )
  }

  // FAR EAST: Malaysia (duty paid, per-kg weight rows) + Singapore (single flat band).
  const myRows = [
    { row: 18, w: 0.5 },
    { row: 19, w: 1 },
    { row: 20, w: 2 },
    { row: 21, w: 3 },
    { row: 22, w: 4 },
    { row: 23, w: 5 },
    { row: 24, w: 6 },
    { row: 25, w: 7 },
    { row: 26, w: 8 },
    { row: 27, w: 9 },
  ]
  const mySlabs: RateSlab[] = []
  let prevW = 0
  for (const { row, w } of myRows) {
    const v = numOrWarn(s.rows[row]?.[2], warnings, 'ACX MALAYSIA DUTY PAID')
    if (v !== null)
      mySlabs.push({ zone: 'MY', weight_from: prevW, weight_to: w, slab_type: 'per_kg', price: v })
    prevW = w
  }
  const myTail = numOrWarn(s.rows[28]?.[2], warnings, 'ACX MALAYSIA DUTY PAID') // "10 TO 24 KG"
  if (myTail !== null)
    mySlabs.push({ zone: 'MY', weight_from: 10, weight_to: 24, slab_type: 'per_kg', price: myTail })
  out.push(
    svc({
      code: 'ACX_MALAYSIA_DUTY_PAID',
      dest: country('MY'),
      duty: 'DDP',
      pricing_mode: 'flat',
      slabs: mySlabs,
      notes: notes50Awb,
    }),
  )

  const sgRate = numOrWarn(s.rows[18]?.[5], warnings, 'ACX SINGAPORE NON DUTY PAID') // "6 To 25 Kg | 395"
  out.push(
    svc({
      code: 'ACX_SINGAPORE_NON_DUTY_PAID',
      dest: country('SG'),
      min_weight_kg: 6,
      pricing_mode: 'flat',
      slabs:
        sgRate !== null
          ? [{ zone: 'SG', weight_from: 6, weight_to: 25, slab_type: 'per_kg', price: sgRate }]
          : [],
      notes: notes50Awb,
    }),
  )

  return out
}

const RAKHEE_ECO_DESTS: [string, string][] = [
  ['USA', 'US'],
  ['UK / OMAN', 'GB'],
  ['AUSTRALIA', 'AU'],
  ['CANADA / MALTA', 'CA'],
  ['NEWZEALAND', 'NZ'],
  ['GERMANY', 'DE'],
  ['FRANCE', 'FR'],
  ['UAE / CHINA / MYANMAR / BHUTAN / SINGAPORE / THAILAND', 'AE'],
  ['JAPAN', 'JP'],
  ['HONG KONG / VIETNAM / MALAYSIA', 'HK'],
]

function parseRakhee(wb: ParsedWorkbook, warnings: string[]): ServiceExport[] {
  const s = sheet(wb, 'RAKHEE SPECIAL')
  const notes = [
    'Seasonal Rakhi promotion, valid till 20 Aug',
    'AWB charges 50 INR',
    'Delay/lost claims not entertained',
  ]

  // EXP block: destination rows x 1KG/2KG per-kg-rate columns.
  const expDestRows: [string, number][] = [
    ['UK', 4],
    ['UAE', 5],
    ['USA SELF', 6],
    ['CANADA SELF EXPRESS', 7],
    ['AUSTRALIA SELF', 8],
    ['NEWZEALAND SELF', 9],
  ]
  const exp: ServiceExport[] = expDestRows.map(([label, row]) => {
    const ctx = `RAKHEE SPECIAL EXP ${label}`
    const v1 = numOrWarn(s.rows[row]?.[1], warnings, ctx)
    const v2 = numOrWarn(s.rows[row]?.[2], warnings, ctx)
    const slabs: RateSlab[] = []
    if (v1 !== null)
      slabs.push({ zone: label, weight_from: 0, weight_to: 1, slab_type: 'per_kg', price: v1 })
    if (v2 !== null)
      slabs.push({ zone: label, weight_from: 1, weight_to: 2, slab_type: 'per_kg', price: v2 })
    return svc({
      code: `ACX_RAKHEE_EXP_${label.replace(/[^A-Z0-9]+/gi, '_').toUpperCase()}`,
      dest: { type: 'group', name: label },
      pricing_mode: 'flat',
      slabs,
      notes: [
        ...notes,
        `Piggybacks pricing on the "${label}" self-network service — not an independent lane`,
      ],
    })
  })

  // ECO block: destination rows x 500/1000/1500/2000g total-price bands.
  // Columns 0-3 belong to the EXP block (DESTINATION|1KG|2KG|blank); ECO
  // starts at col 4 (DESTINATION) with its own bands at 5-8.
  const bands = [
    { col: 5, weight_from: 0, weight_to: 0.5, slab_type: 'total' as SlabType },
    { col: 6, weight_from: 0.5, weight_to: 1, slab_type: 'total' as SlabType },
    { col: 7, weight_from: 1, weight_to: 1.5, slab_type: 'total' as SlabType },
    { col: 8, weight_from: 1.5, weight_to: 2, slab_type: 'total' as SlabType },
  ]
  const eco: ServiceExport[] = RAKHEE_ECO_DESTS.map(([label, iso2], i) => {
    const row = 4 + i
    const slabs: RateSlab[] = []
    for (const b of bands) {
      const v = numOrWarn(s.rows[row]?.[b.col], warnings, `RAKHEE SPECIAL ECO ${label}`)
      if (v !== null)
        slabs.push({
          zone: label,
          weight_from: b.weight_from,
          weight_to: b.weight_to,
          slab_type: b.slab_type,
          price: v,
        })
    }
    return svc({
      code: `ACX_RAKHEE_ECO_${iso2}`,
      dest: country(iso2),
      pricing_mode: 'flat',
      slabs,
      notes,
    })
  })

  return [...exp, ...eco]
}

// ---------------------------------------------------------------------------
// Top level
// ---------------------------------------------------------------------------

export function parseAcxWorkbook(wb: ParsedWorkbook): RateSheetExport {
  const warnings: string[] = []

  warnings.push(
    'Sheet "UPS-FEDEX US-CA" not parsed — DHL/UPS/FedEx interline resale rates in an irregular layout (duplicate headers, mixed doc/package/cash-and-carry sub-blocks). Needs manual mapping.',
  )
  warnings.push(
    'Sheets INDEX, ACX CONTACT MATRIX, ACX TRACKING SITE LIST intentionally skipped (no rate data).',
  )

  const zone_maps: ZoneMap[] = [
    buildUsaZoneMap(wb),
    buildAuZoneMap(wb, warnings),
    buildNzZoneMap(wb, warnings),
    buildCanadaZoneMap(wb),
  ]

  const services: ServiceExport[] = [
    parseUsa(wb, warnings),
    ...parseAustralia(wb, warnings),
    ...parseNewZealand(wb, warnings),
    ...parseCanada(wb, 'ACX SELF CANADA EXPRESS', 'ACX_CANADA_EXPRESS', warnings),
    ...parseCanada(wb, 'ACX SELF CANADA ECONOMY', 'ACX_CANADA_ECONOMY', warnings),
    ...parseUk(wb, warnings),
    ...parseEurope(wb, 'ACX SELF EUROPE', 'ACX_EUROPE', 'Express', warnings),
    ...parseEurope(wb, 'ACX SELF EUROPE ECONOMY', 'ACX_EUROPE_ECO', 'Economy', warnings),
    ...parseExMumbai(wb, warnings),
    ...parseAfrica(wb, warnings),
    ...parseDubaiMideastFarEast(wb, warnings),
    ...parseRakhee(wb, warnings),
  ]

  return {
    provider: 'ACX',
    price_variant: 'CASH',
    currency: 'INR',
    effective_from: '2026-08-03',
    source_file: wb.fileName,
    source_sha256: wb.sha256,
    generated_at: new Date().toISOString(),
    services,
    zone_maps,
    warnings,
  }
}
