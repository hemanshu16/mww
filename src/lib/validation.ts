import { z } from 'zod'

export const PHONE_REGEX = /^\+?[0-9]{7,15}$/

/** Password rules: ≥8 chars, ≥1 lowercase, ≥1 uppercase, ≥1 number. */
export const passwordChecks = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'One lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'One number', test: (v: string) => /[0-9]/.test(v) },
] as const

export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[a-z]/, 'One lowercase letter required')
  .regex(/[A-Z]/, 'One uppercase letter required')
  .regex(/[0-9]/, 'One number required')

export const phoneSchema = z
  .string()
  .regex(PHONE_REGEX, 'Enter a valid phone number (7–15 digits, optional +)')

export const emailSchema = z.string().min(1, 'Email is required').email('Enter a valid email')
