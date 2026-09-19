import type { Step1FormValues, Step2FormValues } from '@/lib/bookingSchemas'
import type {
  Booking,
  ConsigneeInput,
  CreateBookingInput,
  InvoiceInput,
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
    courierProviderId: '',
    shipmentType: 'NON_DOCUMENT',
    shipmentDate: todayInput(),
    referenceNumber: '',
    remarks: '',
    packages: [{ actualWeight: '', lengthCm: '', widthCm: '', heightCm: '', volumetricDivisor: '' }],
  }
}

export function bookingToStep1(b: Booking): Step1FormValues {
  return {
    courierProviderId: b.courierProviderId,
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
  }
  if (values.referenceNumber?.trim()) input.referenceNumber = values.referenceNumber.trim()
  if (values.remarks?.trim()) input.remarks = values.remarks.trim()
  return input
}

export function step1ToUpdateInput(values: Step1FormValues): UpdateBookingInput {
  return {
    courierProviderId: values.courierProviderId,
    shipmentType: values.shipmentType,
    shipmentDate: values.shipmentDate,
    referenceNumber: nn(values.referenceNumber),
    remarks: nn(values.remarks),
    packages: toPackageInputs(values),
  }
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
        : {}),
      note: c?.note ?? '',
    },
    invoice: {
      invoiceType: inv?.invoiceType ?? '',
      currency: inv?.currency ?? '',
      invoiceNo: inv?.invoiceNo ?? '',
      invoiceDate: toDateInput(inv?.invoiceDate) ?? '',
      invoiceTerms: inv?.invoiceTerms ?? '',
    },
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

  return parties
}
