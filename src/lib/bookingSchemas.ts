import { z } from 'zod'
import { INVOICE_TYPES, ITEM_PRIORITIES, KYC_TYPES, SHIPMENT_TYPES } from '@/lib/types'

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
  consigneeCountryCode: z.string().min(1, 'Choose where the shipment is going'),
  // Required only for zip-level-rate countries; enforced in Step1Shipment,
  // which knows the selected country.
  consigneeZipCode: z.string().trim(),
  // Customers set it by picking a rate quote; admins pick it directly.
  courierProviderId: z.string().min(1, 'Choose a courier'),
  ratePerKg: z.number().nullable(),
  totalPrice: z.number().nullable(),
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

export const itemSchema = z.object({
  boxNumber: z.number().int().min(1),
  priority: z.enum(ITEM_PRIORITIES),
  name: z.string().trim().min(1, 'Enter what the item is'),
  quantity: z
    .string()
    .trim()
    .min(1, 'Required')
    .refine((v) => /^\d+$/.test(v) && Number(v) >= 1, 'Whole number, 1 or more'),
  price: z
    .string()
    .trim()
    .min(1, 'Required')
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), 'Up to 2 decimals'),
  hsnCode: z.string().trim().min(1, 'Required'),
  // Grams; optional.
  weight: z
    .string()
    .trim()
    .refine((v) => !v || (Number.isFinite(Number(v)) && Number(v) > 0), 'Must be more than 0'),
})
export type ItemFormValues = z.infer<typeof itemSchema>

export const step2Schema = z.object({
  shipper: shipperSchema,
  consignee: consigneeSchema,
  invoice: invoiceSchema,
  items: z.array(itemSchema),
})
export type Step2FormValues = z.infer<typeof step2Schema>
