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
  /** 1-based position; packages are sorted by it. */
  boxNumber?: number
  actualWeight: number
  lengthCm: number
  widthCm: number
  heightCm: number
  volumetricDivisor: number
  volumetricWeight: number
  chargeableWeight: number
}

export const ITEM_PRIORITIES = ['NORMAL', 'HIGH'] as const
export type ItemPriority = (typeof ITEM_PRIORITIES)[number]

/** A declared item inside one of the booking's boxes. */
export interface BookingItem {
  id: string
  lineNumber: number
  boxNumber: number
  priority: ItemPriority
  name: string
  quantity: number
  price: number
  hsnCode: string
  /** Grams. */
  weight: number | null
}

export interface ItemInput {
  boxNumber: number
  priority?: ItemPriority
  name: string
  quantity: number
  price: number
  hsnCode: string
  /** Grams. */
  weight?: number
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
  /** Always present; ordered as sent. */
  items?: BookingItem[]
  consigneeCountryCode?: string | null
  consigneeZipCode?: string | null
  ratePerKg?: number | null
  totalPrice?: number | null
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
// Countries (admin)
// ---------------------------------------------------------------------------
export interface Country {
  id: string
  name: string
  alpha2: string
  alpha3: string
  region: string | null
  subregion: string | null
  flagUrl: string | null
  isVisible: boolean
  isZipcodeLevelRates: boolean
  createdAt: string
  updatedAt: string
}

export interface CountryList {
  items: Country[]
  pagination: Pagination
}

export interface CountryInput {
  name: string
  alpha2: string
  alpha3: string
  region?: string | null
  subregion?: string | null
  flagUrl?: string | null
  isVisible?: boolean
  isZipcodeLevelRates?: boolean
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
  /** ISO alpha-2 of the destination country. */
  consigneeCountryCode: string
  /** Only when the destination prices by zip code. */
  consigneeZipCode?: string
  /** Chosen quote: price per chargeable kg (INR). */
  ratePerKg?: number
  /** Chosen quote: ratePerKg × chargeable weight (INR). */
  price?: number
}

export type UpdateBookingInput = Partial<{
  courierProviderId: string
  shipmentType: ShipmentType
  shipmentDate: string
  referenceNumber: string | null
  remarks: string | null
  packages: PackageInput[]
  consigneeCountryCode: string
  consigneeZipCode: string | null
  ratePerKg: number | null
  price: number | null
  /** Replace-all: the list sent becomes the complete item list. */
  items: ItemInput[]
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
  /** Replace-all; omit to leave items unchanged. */
  items?: ItemInput[]
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
