import { detectSheet } from '@/lib/rateImport/detect'
import type { CellValue, ParsedSheet } from '@/lib/rateImport/types'

export const RATE_SHEET_PARSERS = [
  {
    id: 'acx',
    label: 'ACX rate sheet',
    description: 'ACX multi-service sheets, including USA state and AU/NZ postcode zones.',
    examples: ['ACX USA SELF DDP', 'ACX SELF AUSTRALIA', 'ACX SELF EUROPE'],
  },
  {
    id: 'australia-self',
    label: 'Australia Self',
    description: 'Australia Self rates and its postcode-to-zone mapping.',
    examples: ['RATES', 'ZONE LIST'],
  },
  {
    id: 'fedex-sssi',
    label: 'FedEx SSSI',
    description: 'FedEx International Priority document and package zone tariffs.',
    examples: ['Sheet1'],
  },
  {
    id: 'flyswift',
    label: 'FlySwift co-courier',
    description: 'FlySwift slabs, USA ZIP zones, Australian, Canadian, NZ and EU services.',
    examples: ['Self', 'AUS DTDC', 'USA DDP', 'MUM YYZ DDP'],
  },
  {
    id: 'sssi-canada',
    label: 'SSSI Canada',
    description: 'Canada YVR/YYZ DDP tariffs with postal-code and zone lookup data.',
    examples: ['CANADA YVR DDP', 'CANDA YYZ DDP', 'SELF ZIPCODE & ZONE LIST'],
  },
  {
    id: 'skynet-mumbai-cash',
    label: 'SkyNet Mumbai Cash',
    description: 'Cash rates for Australia, Europe, NZ, Singapore, Dubai, Malaysia and UK.',
    examples: ['AUS SAVER', 'EU DPD', 'NZL', 'UK'],
  },
  {
    id: 'swwe-skynet',
    label: 'SWWE SkyNet tariff + GST',
    description: 'SkyNet tariff with GST, DDP/DDU, postcode zones and remote-area charges.',
    examples: ['AUS-SAVER', 'CA-DDP', 'MYS', 'EU', 'NZL'],
  },
] as const

export type RateSheetParserId = (typeof RATE_SHEET_PARSERS)[number]['id']

export type ParsedRateRow = {
  weight: string
  prices: { destination: string; value: string; available: boolean }[]
}

export type ParserPreview = {
  configuration: 'zone_based' | 'country_based' | 'postcode_based' | 'weight_only' | 'not_detected'
  headerRow: number | null
  rateRows: ParsedRateRow[]
  hasZoneMap: boolean
  message: string
  warnings: string[]
}

function cellText(value: CellValue | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function cellNumber(value: CellValue | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const match = cellText(value).match(/^\s*(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : null
}

function isUnavailable(value: string): boolean {
  return /^(tbu|n\/a|na|-|on request)$/i.test(value)
}

function displayRate(value: CellValue | undefined): { value: string; available: boolean } {
  const raw = cellText(value)
  if (!raw || isUnavailable(raw)) return { value: raw || '—', available: false }
  const numeric = cellNumber(value)
  return {
    value: numeric === null ? raw : String(Math.round(numeric * 100) / 100),
    available: true,
  }
}

function findWeightHeader(sheet: ParsedSheet): { row: number; col: number } | null {
  const scanRows = Math.min(sheet.rows.length, 35)
  for (let row = 0; row < scanRows; row++) {
    for (let col = 0; col < sheet.cols; col++) {
      if (/\b(weight|wt|kg|weight_kg)\b/i.test(cellText(sheet.rows[row][col]))) {
        return { row, col }
      }
    }
  }
  return null
}

/**
 * Fallback for country-matrix sheets whose headers are destinations rather than
 * "Zone". It intentionally only reads a small preview; the complete raw sheet
 * remains available in the virtualized grid.
 */
function readGenericWeightTable(sheet: ParsedSheet): ParserPreview | null {
  const anchor = findWeightHeader(sheet)
  if (!anchor) return null
  const header = sheet.rows[anchor.row]
  const destinations = header
    .map((value, col) => ({ col, label: cellText(value) }))
    .filter(({ col, label }) => col > anchor.col && label !== '')
    .slice(0, 24)
  if (destinations.length === 0) return null

  const rateRows: ParsedRateRow[] = []
  for (let row = anchor.row + 1; row < sheet.rows.length && rateRows.length < 12; row++) {
    const weight = cellText(sheet.rows[row][anchor.col])
    if (!weight) continue
    if (cellNumber(sheet.rows[row][anchor.col]) === null) break
    rateRows.push({
      weight,
      prices: destinations.map(({ col, label }) => ({
        destination: label,
        ...displayRate(sheet.rows[row][col]),
      })),
    })
  }
  if (rateRows.length === 0) return null

  const zoneCount = destinations.filter(({ label }) => /zone|^d\d+$/i.test(label)).length
  return {
    configuration: zoneCount > 0 ? 'zone_based' : 'country_based',
    headerRow: anchor.row,
    rateRows,
    hasZoneMap: false,
    message: `Detected a weight table with ${destinations.length} destination columns.`,
    warnings: [],
  }
}

export function parserDefinition(id: RateSheetParserId) {
  return RATE_SHEET_PARSERS.find((parser) => parser.id === id)!
}

export function looksRelevantToParser(id: RateSheetParserId, sheetName: string): boolean {
  const name = sheetName.toLowerCase()
  if (/index|contact|tracking|matrix|terms/.test(name)) return false
  const patterns: Record<RateSheetParserId, RegExp> = {
    acx: /acx|usa|australia|newzealand|canada|uk|europe|africa|dubai|ups|fedex|zone/i,
    'australia-self': /rates|zone/i,
    'fedex-sssi': /sheet/i,
    flyswift: /self|aus|dtdc|nz|usa|yyz|yvr|europe/i,
    'sssi-canada': /can|zip|zone/i,
    'skynet-mumbai-cash': /aus|eu|nzl|sin|dxb|mys|uk/i,
    'swwe-skynet': /aus|uk|ca|mys|eu|nzl|dxb|sin|usa|hk/i,
  }
  return patterns[id].test(name)
}

export function previewWithParser(id: RateSheetParserId, sheet: ParsedSheet): ParserPreview {
  const definition = parserDefinition(id)
  const mapping = detectSheet(sheet, 0)

  if (mapping.rates) {
    const { rates } = mapping
    const rateRows: ParsedRateRow[] = []
    for (let row = rates.firstDataRow; row <= rates.lastDataRow && rateRows.length < 12; row++) {
      rateRows.push({
        weight: cellText(sheet.rows[row][rates.weightCol]),
        prices: rates.zoneCols.map(({ col, zone }) => ({
          destination: zone,
          ...displayRate(sheet.rows[row][col]),
        })),
      })
    }
    return {
      configuration: rates.pricingMode === 'zoned' ? 'zone_based' : 'weight_only',
      headerRow: rates.headerRow,
      rateRows,
      hasZoneMap: Boolean(mapping.zoneMap),
      message: `${definition.label} parser detected ${rates.zoneCols.length} rate column${rates.zoneCols.length === 1 ? '' : 's'}.`,
      warnings: mapping.zoneMap
        ? []
        : ['No postcode, ZIP, state, or zone lookup table was detected in this worksheet.'],
    }
  }

  const generic = readGenericWeightTable(sheet)
  if (generic) {
    return {
      ...generic,
      hasZoneMap: Boolean(mapping.zoneMap),
      warnings: mapping.zoneMap
        ? generic.warnings
        : [...generic.warnings, 'No location lookup table was detected in this worksheet.'],
    }
  }

  if (mapping.zoneMap) {
    return {
      configuration: 'postcode_based',
      headerRow: mapping.zoneMap.headerRow,
      rateRows: [],
      hasZoneMap: true,
      message: `${definition.label} parser detected a location-to-zone lookup sheet.`,
      warnings: [
        'This worksheet maps destinations to zones; select its related rate worksheet to preview prices.',
      ],
    }
  }

  return {
    configuration: 'not_detected',
    headerRow: null,
    rateRows: [],
    hasZoneMap: false,
    message: `${definition.label} could not identify a supported rate or location table in this worksheet.`,
    warnings: ['Choose a different worksheet or add a sheet-specific parser rule.'],
  }
}
