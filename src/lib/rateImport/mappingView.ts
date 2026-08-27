// Translate a SheetMapping into the visual props the grid needs, and provide
// small immutable editors used by the mapping panel.

import type { GridRegion, TintRole } from '@/components/rate-import/SheetGrid'
import { colLabel } from './parseWorkbook'
import type { CellValue, ParsedSheet, SheetMapping } from './types'

export function buildTints(m: SheetMapping): Record<number, TintRole> {
  const tints: Record<number, TintRole> = {}
  if (m.rates) {
    tints[m.rates.weightCol] = 'weight'
    for (const z of m.rates.zoneCols) tints[z.col] = 'zone'
  }
  if (m.zoneMap) {
    for (const p of m.zoneMap.pairs) {
      tints[p.loCol] = 'key'
      if (p.hiCol !== null) tints[p.hiCol] = 'key'
      tints[p.zoneCol] = 'zonelabel'
    }
    if (m.zoneMap.remoteCol !== null) tints[m.zoneMap.remoteCol] = 'remote'
  }
  return tints
}

export function ratesHighlight(m: SheetMapping): GridRegion | null {
  if (!m.rates) return null
  const cols = [m.rates.weightCol, ...m.rates.zoneCols.map((z) => z.col)]
  return {
    r0: m.rates.headerRow,
    c0: Math.min(...cols),
    r1: m.rates.lastDataRow,
    c1: Math.max(...cols),
  }
}

/** A short preview of a column's header cell, e.g. "A · WEIGHT_KG". */
export function columnLabel(sheet: ParsedSheet, headerRow: number, col: number): string {
  const cell: CellValue | undefined = sheet.rows[headerRow]?.[col]
  const preview = cell === null || cell === undefined ? '' : String(cell).trim().slice(0, 18)
  return preview ? `${colLabel(col)} · ${preview}` : colLabel(col)
}

/** Options for every column in the sheet, previewed against a header row. */
export function columnOptions(
  sheet: ParsedSheet,
  headerRow: number,
): { value: number; label: string }[] {
  return Array.from({ length: sheet.cols }, (_, c) => ({
    value: c,
    label: columnLabel(sheet, headerRow, c),
  }))
}
