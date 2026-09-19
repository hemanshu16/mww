// Shared domain types mirroring the MWW REST API (/api/v1) contract.

// ---------------------------------------------------------------------------
// Envelope
// ---------------------------------------------------------------------------
export interface ApiSuccess<T> {
  success: true
  message?: string
  data: T
}
export interface ApiError {
  success: false
  error: string
}
export type ApiEnvelope<T> = ApiSuccess<T> | ApiError

// ---------------------------------------------------------------------------
// Enums (render exactly these values)
// ---------------------------------------------------------------------------
export const SHIPMENT_TYPES = ['DOCUMENT', 'NON_DOCUMENT', 'PARCEL'] as const
export type ShipmentType = (typeof SHIPMENT_TYPES)[number]

export const BOOKING_STATUSES = ['DRAFT', 'BOOKED', 'CANCELLED'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const KYC_TYPES = ['PAN', 'AADHAAR', 'PASSPORT', 'GST', 'VOTER_ID', 'DRIVING_LICENSE'] as const
export type KycType = (typeof KYC_TYPES)[number]

export const INVOICE_TYPES = ['COMMERCIAL', 'PROFORMA', 'GIFT', 'SAMPLE'] as const
export type InvoiceType = (typeof INVOICE_TYPES)[number]

export const SHIPMENT_TYPE_LABELS: Record<ShipmentType, string> = {
  DOCUMENT: 'Document',
  NON_DOCUMENT: 'Non-document',
  PARCEL: 'Parcel',
}
export const KYC_TYPE_LABELS: Record<KycType, string> = {
  PAN: 'PAN',
  AADHAAR: 'Aadhaar',
  PASSPORT: 'Passport',
  GST: 'GST',
  VOTER_ID: 'Voter ID',
  DRIVING_LICENSE: 'Driving licence',
}
export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  COMMERCIAL: 'Commercial',
  PROFORMA: 'Proforma',
  GIFT: 'Gift',
  SAMPLE: 'Sample',
}

// ---------------------------------------------------------------------------
// Auth / profile
// ---------------------------------------------------------------------------
export interface Profile {
  id: string
  firstName: string
  lastName: string
  companyName: string
  phoneNumber: string
  email: string
  isGstBilling: boolean
  isEmailVerified: boolean
  createdAt: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  profile: Profile
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

// ---------------------------------------------------------------------------
// Courier providers
// ---------------------------------------------------------------------------
export interface CourierProvider {
  id: string
  name: string
  logoUrl: string | null
  serviceCharge: number
  isGstApplicable: boolean
  status: string
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------
export interface Package {
  id: string
  actualWeight: number
  lengthCm: number
  widthCm: number
  heightCm: number
  volumetricDivisor: number
  volumetricWeight: number
  chargeableWeight: number
}

export interface BookingSummary {
  boxCount: number
  totalActualWeight: number
  totalVolumetricWeight: number
  totalChargeableWeight: number
}

export interface Shipper {
  id: string
  bookingId: string
  fullName: string
  attention: string | null
  address1: string
  address2: string | null
  address3: string | null
  city: string
  state: string
  zipCode: string
  country: string
  phoneNo: string
  phoneNoAlt: string | null
  email: string | null
  reference: string | null
  kyc1Type: KycType | null
  kyc1Number: string | null
  kyc1DocFront: string | null
  kyc1DocBack: string | null
  kyc2Type: KycType | null
  kyc2Number: string | null
  kyc2Doc: string | null
  createdAt: string
  updatedAt: string
}

export interface Consignee {
  id: string
  bookingId: string
  fullName: string
  attention: string | null
  address1: string
  address2: string | null
  address3: string | null
  city: string
  state: string
  zipCode: string
  country: string
  phoneNo: string
  phoneNoAlt: string | null
  email: string | null
  reference: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  bookingId: string
  invoiceType: InvoiceType
  currency: string
  invoiceNo: string | null
  invoiceDate: string | null
  invoiceTerms: string | null
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: string
  bookingNumber: string
  courierProviderId: string
  shipmentType: ShipmentType
  shipmentDate: string
  referenceNumber: string | null
  remarks: string | null
  status: BookingStatus
  packages: Package[]
  summary: BookingSummary
  shipper: Shipper | null
  consignee: Consignee | null
  invoice: Invoice | null
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface BookingList {
  items: Booking[]
  pagination: Pagination
}

// ---------------------------------------------------------------------------
// Request payloads
// ---------------------------------------------------------------------------
export interface PackageInput {
  actualWeight: number
  lengthCm: number
  widthCm: number
  heightCm: number
  volumetricDivisor?: number
}

export interface CreateBookingInput {
  courierProviderId: string
  shipmentType: ShipmentType
  shipmentDate: string
  referenceNumber?: string | null
  remarks?: string | null
  packages: PackageInput[]
}

export type UpdateBookingInput = Partial<{
  courierProviderId: string
  shipmentType: ShipmentType
  shipmentDate: string
  referenceNumber: string | null
  remarks: string | null
  packages: PackageInput[]
}>

export interface ShipperInput {
  fullName: string
  attention?: string | null
  address1: string
  address2?: string | null
  address3?: string | null
  city: string
  state: string
  zipCode: string
  country: string
  phoneNo: string
  phoneNoAlt?: string | null
  email?: string | null
  reference?: string | null
  kyc1Type?: KycType | null
  kyc1Number?: string | null
  kyc1DocFront?: string | null
  kyc1DocBack?: string | null
  kyc2Type?: KycType | null
  kyc2Number?: string | null
  kyc2Doc?: string | null
}

export interface ConsigneeInput {
  fullName: string
  attention?: string | null
  address1: string
  address2?: string | null
  address3?: string | null
  city: string
  state: string
  zipCode: string
  country: string
  phoneNo: string
  phoneNoAlt?: string | null
  email?: string | null
  reference?: string | null
  note?: string | null
}

export interface InvoiceInput {
  invoiceType: InvoiceType
  currency: string
  invoiceNo?: string | null
  invoiceDate?: string | null
  invoiceTerms?: string | null
}

export interface PartiesInput {
  shipper?: ShipperInput
  consignee?: ConsigneeInput
  invoice?: InvoiceInput | null
}

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------
export interface KycUploadUrl {
  bucket: string
  path: string
  token: string
  signedUrl: string
}
export interface KycDownloadUrl {
  path: string
  signedUrl: string
  expiresIn: number
}
