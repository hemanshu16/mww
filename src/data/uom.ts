/** Units of measurement for declared items, grouped for the picker. */
export interface UomOption {
  code: string
  label: string
}

export const UOM_OTHER = 'OTH'

export const UOM_GROUPS: { label: string; options: UomOption[] }[] = [
  {
    label: 'Count',
    options: [
      { code: 'PCS', label: 'Pieces' },
      { code: 'NOS', label: 'Numbers' },
      { code: 'UNT', label: 'Unit' },
    ],
  },
  {
    label: 'Packing',
    options: [
      { code: 'PKT', label: 'Packet' },
      { code: 'BOX', label: 'Box' },
      { code: 'CTN', label: 'Carton' },
      { code: 'BAG', label: 'Bag' },
      { code: 'SACK', label: 'Sack' },
      { code: 'BDL', label: 'Bundle' },
      { code: 'SET', label: 'Set' },
      { code: 'PAIR', label: 'Pair' },
      { code: 'DOZ', label: 'Dozen' },
      { code: 'GROSS', label: 'Gross' },
    ],
  },
  {
    label: 'Containers',
    options: [
      { code: 'BTL', label: 'Bottle' },
      { code: 'CAN', label: 'Can' },
      { code: 'JAR', label: 'Jar' },
      { code: 'TUB', label: 'Tub' },
      { code: 'TUBE', label: 'Tube' },
      { code: 'STRIP', label: 'Strip' },
      { code: 'VIAL', label: 'Vial' },
      { code: 'AMP', label: 'Ampoule' },
    ],
  },
  {
    label: 'Bulk',
    options: [
      { code: 'ROL', label: 'Roll' },
      { code: 'COIL', label: 'Coil' },
      { code: 'DRM', label: 'Drum' },
      { code: 'CRT', label: 'Crate' },
      { code: 'PLT', label: 'Pallet' },
      { code: 'CONT', label: 'Container' },
    ],
  },
  {
    label: 'Weight',
    options: [
      { code: 'KG', label: 'Kilogram' },
      { code: 'GRAM', label: 'Gram' },
      { code: 'MG', label: 'Milligram' },
      { code: 'QTL', label: 'Quintal' },
      { code: 'TON', label: 'Metric Ton' },
    ],
  },
  {
    label: 'Volume',
    options: [
      { code: 'LTR', label: 'Litre' },
      { code: 'ML', label: 'Millilitre' },
      { code: 'KL', label: 'Kilolitre' },
    ],
  },
  {
    label: 'Length',
    options: [
      { code: 'MTR', label: 'Metre' },
      { code: 'CM', label: 'Centimetre' },
      { code: 'MM', label: 'Millimetre' },
      { code: 'FT', label: 'Feet' },
      { code: 'IN', label: 'Inch' },
      { code: 'YDS', label: 'Yard' },
    ],
  },
  {
    label: 'Area & cubic',
    options: [
      { code: 'SQM', label: 'Square Metre' },
      { code: 'SQFT', label: 'Square Feet' },
      { code: 'CBM', label: 'Cubic Metre' },
    ],
  },
  {
    label: 'Special',
    options: [
      { code: 'CARAT', label: 'Carat' },
      { code: 'THD', label: 'Thousand' },
      { code: 'GGR', label: 'Great Gross' },
      { code: 'TBS', label: 'Tablespoon' },
      { code: 'TGM', label: 'Ten Gross' },
    ],
  },
  {
    label: 'Other',
    options: [{ code: UOM_OTHER, label: 'Other' }],
  },
]

const UOM_LABELS = new Map(UOM_GROUPS.flatMap((g) => g.options.map((o) => [o.code, o.label])))

/** True for a code from the list (not a free-text "Other" value). */
export function isKnownUom(code: string) {
  return code !== UOM_OTHER && UOM_LABELS.has(code)
}

export function uomLabel(code: string) {
  return UOM_LABELS.get(code)
}
