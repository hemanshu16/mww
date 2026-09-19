import type { BookingSummary, PackageInput } from '@/lib/types'

export const DEFAULT_VOLUMETRIC_DIVISOR = 5000

const round3 = (n: number) => Math.round(n * 1000) / 1000

/** Volumetric weight for one box = (L × W × H) / divisor, rounded to 3 dp. */
export function volumetricWeight(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  divisor: number = DEFAULT_VOLUMETRIC_DIVISOR,
): number {
  if (!lengthCm || !widthCm || !heightCm || !divisor) return 0
  return round3((lengthCm * widthCm * heightCm) / divisor)
}

/** Chargeable weight for one box = max(actual, volumetric). */
export function chargeableWeight(actualWeight: number, vol: number): number {
  return round3(Math.max(actualWeight || 0, vol || 0))
}

/**
 * Live client-side summary for the wizard. The server value is authoritative
 * once saved — this only powers the sticky summary as the user types.
 */
export function computeSummary(packages: PackageInput[]): BookingSummary {
  let totalActualWeight = 0
  let totalVolumetricWeight = 0
  let totalChargeableWeight = 0
  for (const p of packages) {
    const vol = volumetricWeight(p.lengthCm, p.widthCm, p.heightCm, p.volumetricDivisor)
    totalActualWeight += p.actualWeight || 0
    totalVolumetricWeight += vol
    totalChargeableWeight += chargeableWeight(p.actualWeight, vol)
  }
  return {
    boxCount: packages.length,
    totalActualWeight: round3(totalActualWeight),
    totalVolumetricWeight: round3(totalVolumetricWeight),
    totalChargeableWeight: round3(totalChargeableWeight),
  }
}
