/** Display helpers for dates, weights, and enum-ish labels. */

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** ISO date (YYYY-MM-DD) for <input type="date"> and API payloads. */
export function toDateInput(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function todayInput(): string {
  return toDateInput(new Date())
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Wallet amounts: always 2 decimals, e.g. ₹12,500.50. */
export function formatINR(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return inr.format(n)
}

export function formatWeight(kg: number | null | undefined): string {
  if (kg == null) return '—'
  return `${kg.toLocaleString('en-IN', { maximumFractionDigits: 3 })} kg`
}

export function formatDimensions(l: number, w: number, h: number): string {
  return `${l} × ${w} × ${h} cm`
}

/** Trailing file name of a KYC storage path like kyc/<id>/<uuid>-name.jpg. */
export function kycFileName(path: string): string {
  const base = path.split('/').pop() ?? path
  return base.replace(/^[0-9a-f-]{8,}-/i, '')
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
