import type { CourierProvider } from '@/lib/types'

// ---------------------------------------------------------------------------
// MOCK RATES — there is no rates API yet.
// Each provider gets a stable dummy per-kg price (varied by destination so the
// comparison looks realistic). Replace `getRates` with the real endpoint call;
// the returned shape is what the booking UI consumes.
// ---------------------------------------------------------------------------

export const RATE_CURRENCY = 'INR'

export interface RateQuote {
  courierProviderId: string
  providerName: string
  logoUrl: string | null
  /** Price per chargeable kg. */
  ratePerKg: number
  /** Chargeable weight the quote was priced on (kg). */
  chargeableWeight: number
  /** ratePerKg × chargeableWeight, rounded to 2 decimals. */
  totalPrice: number
}

export interface RateRequest {
  countryCode: string
  zipCode?: string
  chargeableWeight: number
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Dummy ₹/kg between 450 and 1,250, in steps of 10. */
function mockRatePerKg(providerId: string, countryCode: string): number {
  return 450 + (hash(`${providerId}:${countryCode}`) % 81) * 10
}

const round2 = (n: number) => Math.round(n * 100) / 100

export async function getRates(
  providers: Pick<CourierProvider, 'id' | 'name' | 'logoUrl'>[],
  req: RateRequest,
): Promise<RateQuote[]> {
  return providers
    .map((p) => {
      const ratePerKg = mockRatePerKg(p.id, req.countryCode)
      return {
        courierProviderId: p.id,
        providerName: p.name,
        logoUrl: p.logoUrl,
        ratePerKg,
        chargeableWeight: req.chargeableWeight,
        totalPrice: round2(ratePerKg * req.chargeableWeight),
      }
    })
    .sort((a, b) => a.totalPrice - b.totalPrice)
}

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: RATE_CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const moneyWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: RATE_CURRENCY,
  maximumFractionDigits: 0,
})
/** ₹2,688 for whole amounts, ₹2,688.50 otherwise. */
export const formatMoney = (n: number) => (Number.isInteger(n) ? moneyWhole : money).format(n)
