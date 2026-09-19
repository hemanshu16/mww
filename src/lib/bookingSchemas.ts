import { z } from 'zod'
import { INVOICE_TYPES, KYC_TYPES, SHIPMENT_TYPES } from '@/lib/types'

// Numeric fields are held as strings in form state (native number inputs emit
// strings) and converted to numbers when building the API payload. This keeps
// react-hook-form typing simple — no z.input/z.output split.
const positiveNumber = (msg = 'Required') =>
  z
    .string()
    .trim()
    .min(1, msg)
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, 'Enter a valid number')

// ---------------------------------------------------------------------------
// Step 1 — shipment & packages
// ---------------------------------------------------------------------------
export const packageSchema = z.object({
  actualWeight: positiveNumber('Weight is required'),
  lengthCm: positiveNumber('L'),
  widthCm: positiveNumber('W'),
  heightCm: positiveNumber('H'),
  volumetricDivisor: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (Number.isFinite(Number(v)) && Number(v) > 0), 'Invalid'),
})
export type PackageFormValues = z.infer<typeof packageSchema>

export const step1Schema = z.object({
  courierProviderId: z.string().min(1, 'Select a courier provider'),
  shipmentType: z.enum(SHIPMENT_TYPES),
  shipmentDate: z.string().min(1, 'Select a shipment date'),
  referenceNumber: z.string().max(80).optional(),
  remarks: z.string().max(500).optional(),
  packages: z.array(packageSchema).min(1, 'Add at least one box'),
})
export type Step1FormValues = z.infer<typeof step1Schema>

// ---------------------------------------------------------------------------
// Step 2 — parties (shipper, consignee, invoice)
// ---------------------------------------------------------------------------
const addressBase = {
  fullName: z.string().min(1, 'Full name is required'),
  attention: z.string().optional(),
  address1: z.string().min(1, 'Address line 1 is required'),
  address2: z.string().optional(),
  address3: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP / postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phoneNo: z.string().min(1, 'Phone number is required'),
  phoneNoAlt: z.string().optional(),
  email: z.union([z.string().email('Enter a valid email'), z.literal('')]).optional(),
  reference: z.string().optional(),
}

const kycTypeField = z.union([z.enum(KYC_TYPES), z.literal('')]).optional()

export const shipperSchema = z.object({
  ...addressBase,
  kyc1Type: kycTypeField,
  kyc1Number: z.string().optional(),
  kyc1DocFront: z.string().optional(),
  kyc1DocBack: z.string().optional(),
  kyc2Type: kycTypeField,
  kyc2Number: z.string().optional(),
  kyc2Doc: z.string().optional(),
})

export const consigneeSchema = z.object({
  ...addressBase,
  note: z.string().optional(),
})

export const invoiceSchema = z
  .object({
    invoiceType: z.union([z.enum(INVOICE_TYPES), z.literal('')]).optional(),
    currency: z.string().optional(),
    invoiceNo: z.string().optional(),
    invoiceDate: z.string().optional(),
    invoiceTerms: z.string().optional(),
  })
  .refine((v) => !(v.invoiceType && !v.currency), {
    path: ['currency'],
    message: 'Currency is required for an invoice',
  })
  .refine((v) => !(v.currency && !v.invoiceType), {
    path: ['invoiceType'],
    message: 'Invoice type is required',
  })

export const step2Schema = z.object({
  shipper: shipperSchema,
  consignee: consigneeSchema,
  invoice: invoiceSchema,
})
export type Step2FormValues = z.infer<typeof step2Schema>
