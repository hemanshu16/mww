// Registry of dedicated per-provider parsers. Each provider's Excel layout is
// hand-mapped (see acx.ts) rather than auto-detected, so a workbook must be
// matched to the right parser before it can run.

import { parseAcxWorkbook } from './acx'
import type { ParsedWorkbook, RateSheetExport } from '../types'

export interface ProviderParser {
  id: string
  label: string
  /** Heuristic match against a parsed workbook's sheet names — used to suggest a provider after upload. */
  matches: (wb: ParsedWorkbook) => boolean
  parse: (wb: ParsedWorkbook) => RateSheetExport
}

export const PROVIDER_PARSERS: ProviderParser[] = [
  {
    id: 'acx',
    label: 'ACX',
    matches: (wb) => wb.sheets.some((s) => /ACX (USA SELF DDP|SELF AUSTRALIA)/i.test(s.name)),
    parse: parseAcxWorkbook,
  },
]

export function guessProvider(wb: ParsedWorkbook): ProviderParser | null {
  return PROVIDER_PARSERS.find((p) => p.matches(wb)) ?? null
}
