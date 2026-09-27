import type { ItemFormValues, Step1FormValues, Step2FormValues } from '@/lib/bookingSchemas'
import type {
  Booking,
  BookingItem,
  ConsigneeInput,
  CreateBookingInput,
  InvoiceInput,
  ItemInput,
  KycType,
  PackageInput,
  PartiesInput,
  ShipperInput,
  UpdateBookingInput,
} from '@/lib/types'
import { todayInput, toDateInput } from '@/lib/format'

/** Trimmed string or null (for optional API fields). */
const nn = (v?: string | null): string | null => {
  const t = (v ?? '').trim()
  return t ? t : null
}
const asKyc = (v?: string): KycType | null => (v ? (v as KycType) : null)

// --- Step 1 ----------------------------------------------------------------
export function emptyStep1(): Step1FormValues {
  return {
    consigneeCountryCode: '',
    consigneeZipCode: '',
    courierProviderId: '',
    ratePerKg: null,
    totalPrice: null,
    shipmentType: 'NON_DOCUMENT',
    shipmentDate: todayInput(),
    referenceNumber: '',
    remarks: '',
    packages: [{ actualWeight: '', lengthCm: '', widthCm: '', heightCm: '', volumetricDivisor: '' }],
  }
}

export function bookingToStep1(b: Booking): Step1FormValues {
  return {
    consigneeCountryCode: b.consigneeCountryCode ?? b.consignee?.country ?? '',
    consigneeZipCode: b.consigneeZipCode ?? '',
    courierProviderId: b.courierProviderId,
    ratePerKg: b.ratePerKg ?? null,
    totalPrice: b.totalPrice ?? null,
    shipmentType: b.shipmentType,
    shipmentDate: toDateInput(b.shipmentDate) || todayInput(),
    referenceNumber: b.referenceNumber ?? '',
    remarks: b.remarks ?? '',
    packages: b.packages.length
      ? b.packages.map((p) => ({
          actualWeight: String(p.actualWeight),
          lengthCm: String(p.lengthCm),
          widthCm: String(p.widthCm),
          heightCm: String(p.heightCm),
          volumetricDivisor: p.volumetricDivisor === 5000 ? '' : String(p.volumetricDivisor),
        }))
      : emptyStep1().packages,
  }
}

function toPackageInputs(values: Step1FormValues): PackageInput[] {
  return values.packages.map((p) => {
    const pkg: PackageInput = {
      actualWeight: Number(p.actualWeight),
      lengthCm: Number(p.lengthCm),
      widthCm: Number(p.widthCm),
      heightCm: Number(p.heightCm),
    }
    if (p.volumetricDivisor && p.volumetricDivisor.trim()) {
      pkg.volumetricDivisor = Number(p.volumetricDivisor)
    }
    return pkg
  })
}

export function step1ToCreateInput(values: Step1FormValues): CreateBookingInput {
  const input: CreateBookingInput = {
    courierProviderId: values.courierProviderId,
    shipmentType: values.shipmentType,
    shipmentDate: values.shipmentDate,
    packages: toPackageInputs(values),
    consigneeCountryCode: values.consigneeCountryCode,
  }
  if (values.consigneeZipCode) input.consigneeZipCode = values.consigneeZipCode
  if (values.ratePerKg !== null) input.ratePerKg = values.ratePerKg
  if (values.totalPrice !== null) input.price = values.totalPrice
  if (values.referenceNumber?.trim()) input.referenceNumber = values.referenceNumber.trim()
  if (values.remarks?.trim()) input.remarks = values.remarks.trim()
  return input
}

/**
 * `items` is passed only when step 1 renumbered or dropped items (a box was
 * removed); the API needs the updated list in the same request as fewer packages.
 */
export function step1ToUpdateInput(
  values: Step1FormValues,
  items?: BookingItem[],
): UpdateBookingInput {
  const input: UpdateBookingInput = {
    courierProviderId: values.courierProviderId,
    shipmentType: values.shipmentType,
    shipmentDate: values.shipmentDate,
    referenceNumber: nn(values.referenceNumber),
    remarks: nn(values.remarks),
    packages: toPackageInputs(values),
    consigneeCountryCode: values.consigneeCountryCode,
    consigneeZipCode: nn(values.consigneeZipCode),
    ratePerKg: values.ratePerKg,
    price: values.totalPrice,
  }
  if (items) input.items = items.map(bookingItemToInput)
  return input
}

// --- Items -----------------------------------------------------------------
export function emptyItem(boxNumber: number): ItemFormValues {
  return { boxNumber, priority: 'NORMAL', name: '', quantity: '1', price: '', hsnCode: '', weight: '' }
}

function bookingItemToForm(i: BookingItem): ItemFormValues {
  return {
    boxNumber: i.boxNumber,
    priority: i.priority,
    name: i.name,
    quantity: String(i.quantity),
    price: String(i.price),
    hsnCode: i.hsnCode,
    weight: i.weight === null ? '' : String(i.weight),
  }
}

function bookingItemToInput(i: BookingItem): ItemInput {
  const input: ItemInput = {
    boxNumber: i.boxNumber,
    priority: i.priority,
    name: i.name,
    quantity: i.quantity,
    price: i.price,
    hsnCode: i.hsnCode,
  }
  if (i.weight !== null) input.weight = i.weight
  return input
}

/** Form rows → API items, grouped by box (stable within a box). */
export function itemsToInput(items: ItemFormValues[]): ItemInput[] {
  return [...items]
    .sort((a, b) => a.boxNumber - b.boxNumber)
    .map((i) => {
      const input: ItemInput = {
        boxNumber: i.boxNumber,
        priority: i.priority,
        name: i.name.trim(),
        quantity: Number(i.quantity),
        price: Number(i.price),
        hsnCode: i.hsnCode.trim(),
      }
      if (i.weight.trim()) input.weight = Number(i.weight)
      return input
    })
}

/**
 * Removing box `removed` (1-based) drops its items and shifts items in later
 * boxes down by one, matching how the remaining packages are renumbered.
 */
export function itemsAfterRemovingBox(items: BookingItem[], removed: number): BookingItem[] {
  return items
    .filter((i) => i.boxNumber !== removed)
    .map((i) => (i.boxNumber > removed ? { ...i, boxNumber: i.boxNumber - 1 } : i))
}

// --- Step 2 ----------------------------------------------------------------
function emptyAddress() {
  return {
    fullName: '',
    attention: '',
    address1: '',
    address2: '',
    address3: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phoneNo: '',
    phoneNoAlt: '',
    email: '',
    reference: '',
  }
}

export function bookingToStep2(b: Booking): Step2FormValues {
  const s = b.shipper
  const c = b.consignee
  const inv = b.invoice
  return {
    shipper: {
      ...emptyAddress(),
      ...(s
        ? {
            fullName: s.fullName,
            attention: s.attention ?? '',
            address1: s.address1,
            address2: s.address2 ?? '',
            address3: s.address3 ?? '',
            city: s.city,
            state: s.state,
            zipCode: s.zipCode,
            country: s.country,
            phoneNo: s.phoneNo,
            phoneNoAlt: s.phoneNoAlt ?? '',
            email: s.email ?? '',
            reference: s.reference ?? '',
          }
        : {}),
      kyc1Type: s?.kyc1Type ?? '',
      kyc1Number: s?.kyc1Number ?? '',
      kyc1DocFront: s?.kyc1DocFront ?? '',
      kyc1DocBack: s?.kyc1DocBack ?? '',
      kyc2Type: s?.kyc2Type ?? '',
      kyc2Number: s?.kyc2Number ?? '',
      kyc2Doc: s?.kyc2Doc ?? '',
    },
    consignee: {
      ...emptyAddress(),
      ...(c
        ? {
            fullName: c.fullName,
            attention: c.attention ?? '',
            address1: c.address1,
            address2: c.address2 ?? '',
            address3: c.address3 ?? '',
            city: c.city,
            state: c.state,
            zipCode: c.zipCode,
            country: c.country,
            phoneNo: c.phoneNo,
            phoneNoAlt: c.phoneNoAlt ?? '',
            email: c.email ?? '',
            reference: c.reference ?? '',
          }
        : // First visit to step 2: carry the destination chosen in step 1.
          {
            country: b.consigneeCountryCode ?? '',
            zipCode: b.consigneeZipCode ?? '',
          }),
      note: c?.note ?? '',
    },
    invoice: {
      invoiceType: inv?.invoiceType ?? '',
      currency: inv?.currency ?? '',
      invoiceNo: inv?.invoiceNo ?? '',
      invoiceDate: toDateInput(inv?.invoiceDate) ?? '',
      invoiceTerms: inv?.invoiceTerms ?? '',
    },
    items: (b.items ?? []).map(bookingItemToForm),
  }
}

export function emptyStep2(): Step2FormValues {
  return {
    shipper: {
      ...emptyAddress(),
      kyc1Type: '',
      kyc1Number: '',
      kyc1DocFront: '',
      kyc1DocBack: '',
      kyc2Type: '',
      kyc2Number: '',
      kyc2Doc: '',
    },
    consignee: { ...emptyAddress(), note: '' },
    invoice: { invoiceType: '', currency: '', invoiceNo: '', invoiceDate: '', invoiceTerms: '' },
    items: [],
  }
}

export function step2ToPartiesInput(values: Step2FormValues): PartiesInput {
  const s = values.shipper
  const c = values.consignee
  const inv = values.invoice

  const shipper: ShipperInput = {
    fullName: s.fullName.trim(),
    attention: nn(s.attention),
    address1: s.address1.trim(),
    address2: nn(s.address2),
    address3: nn(s.address3),
    city: s.city.trim(),
    state: s.state.trim(),
    zipCode: s.zipCode.trim(),
    country: s.country.trim(),
    phoneNo: s.phoneNo.trim(),
    phoneNoAlt: nn(s.phoneNoAlt),
    email: nn(s.email),
    reference: nn(s.reference),
    kyc1Type: asKyc(s.kyc1Type),
    kyc1Number: nn(s.kyc1Number),
    kyc1DocFront: nn(s.kyc1DocFront),
    kyc1DocBack: nn(s.kyc1DocBack),
    kyc2Type: asKyc(s.kyc2Type),
    kyc2Number: nn(s.kyc2Number),
    kyc2Doc: nn(s.kyc2Doc),
  }

  const consignee: ConsigneeInput = {
    fullName: c.fullName.trim(),
    attention: nn(c.attention),
    address1: c.address1.trim(),
    address2: nn(c.address2),
    address3: nn(c.address3),
    city: c.city.trim(),
    state: c.state.trim(),
    zipCode: c.zipCode.trim(),
    country: c.country.trim(),
    phoneNo: c.phoneNo.trim(),
    phoneNoAlt: nn(c.phoneNoAlt),
    email: nn(c.email),
    reference: nn(c.reference),
    note: nn(c.note),
  }

  const parties: PartiesInput = { shipper, consignee }

  if (inv.invoiceType && inv.currency?.trim()) {
    const invoice: InvoiceInput = {
      invoiceType: inv.invoiceType,
      currency: inv.currency.trim(),
      invoiceNo: nn(inv.invoiceNo),
      invoiceDate: nn(inv.invoiceDate),
      invoiceTerms: nn(inv.invoiceTerms),
    }
    parties.invoice = invoice
  }

  // Replace-all: the form holds the complete list, so always send it.
  parties.items = itemsToInput(values.items)

  return parties
}
