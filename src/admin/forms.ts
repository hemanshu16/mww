import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { ApiRequestError } from '@/lib/api/client'

/**
 * Put a 400's `field: message` parts on the matching form fields.
 * Returns true when at least one field got an error.
 */
export function applyFieldErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
  fields: readonly Path<T>[],
): boolean {
  if (!(error instanceof ApiRequestError) || !error.fieldErrors) return false
  let mapped = false
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    if ((fields as readonly string[]).includes(field)) {
      form.setError(field as Path<T>, { message })
      mapped = true
    }
  }
  return mapped
}

/** Random password meeting the staff rules (upper, lower, digit, ≥ 8). */
export function generatePassword(length = 12): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789']
  const all = sets.join('')
  const pick = (chars: string) =>
    chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length]
  const chars = [
    ...sets.map(pick),
    ...Array.from({ length: length - sets.length }, () => pick(all)),
  ]
  // Shuffle so the guaranteed characters aren't always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
