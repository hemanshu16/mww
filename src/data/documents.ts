export type DocFormat = 'pdf' | 'excel' | 'word'

export type DocCategory = 'Shipping' | 'Customs' | 'Declarations' | 'Authority Letters' | 'Others'

export interface DocumentEntry {
  id: string
  name: string
  description: string
  category: DocCategory
  files: Partial<Record<DocFormat, string>>
  popular?: boolean
}

const base = '/documents'

export const DOCUMENT_CATEGORIES: DocCategory[] = [
  'Shipping',
  'Customs',
  'Declarations',
  'Authority Letters',
  'Others',
]

export const DOCUMENTS: DocumentEntry[] = [
  {
    id: 'commercial-invoice',
    name: 'Commercial Invoice',
    description: 'Standard commercial invoice for international shipments, required by customs at origin and destination.',
    category: 'Shipping',
    files: { pdf: `${base}/commercial-invoice.pdf`, excel: `${base}/commercial-invoice.xls` },
    popular: true,
  },
  {
    id: 'packing-list',
    name: 'Packing List',
    description: 'Itemised packing list detailing contents, weights and dimensions for each package in a shipment.',
    category: 'Shipping',
    files: { pdf: `${base}/packing-list.pdf`, excel: `${base}/packing-list.xls` },
    popular: true,
  },
  {
    id: 'shippers-letter-instruction',
    name: "Shipper's Letter of Instruction",
    description: 'SLI authorising your freight forwarder to arrange export and complete shipping documentation on your behalf.',
    category: 'Shipping',
    files: { excel: `${base}/shippers-letter-instruction.xls` },
    popular: true,
  },
  {
    id: 'export-value-declaration',
    name: 'Export Value Declaration',
    description: 'Declaration confirming the accurate value of goods being exported, for customs assessment.',
    category: 'Customs',
    files: { excel: `${base}/export-value-declaration.xlsx` },
  },
  {
    id: 'sdf-form',
    name: 'SDF Form',
    description: 'Statutory Declaration Form for export proceeds realisation, as required under RBI/FEMA regulations.',
    category: 'Customs',
    files: { pdf: `${base}/sdf-form.pdf`, excel: `${base}/sdf-form.xls` },
  },
  {
    id: 'aqis-form',
    name: 'AQIS Form',
    description: 'Australian quarantine and inspection declaration required for shipments entering Australia.',
    category: 'Customs',
    files: { pdf: `${base}/aqis-form.pdf`, excel: `${base}/aqis-form.xlsx` },
  },
  {
    id: 'tsca-certificate',
    name: 'TSCA Certificate',
    description: 'Toxic Substances Control Act certification required for chemical-related shipments to the USA.',
    category: 'Customs',
    files: { pdf: `${base}/tsca-certificate.pdf`, excel: `${base}/tsca-certificate.xls` },
  },
  {
    id: 'quota-charge-statement',
    name: 'Quota Charge Statement',
    description: 'Statement of quota charges applicable to restricted-category export shipments.',
    category: 'Customs',
    files: { pdf: `${base}/quota-charge-statement.pdf`, excel: `${base}/quota-charge-statement.xls` },
  },
  {
    id: 'non-dg-declaration',
    name: 'Non-DG Declaration',
    description: 'Declaration confirming a shipment contains no dangerous goods, required by carriers before uplift.',
    category: 'Declarations',
    files: { pdf: `${base}/non-dg-declaration.pdf`, excel: `${base}/non-dg-declaration.xls` },
  },
  {
    id: 'single-country-declaration',
    name: 'Single Country Declaration',
    description: 'Certificate of origin declaration confirming goods originate from a single named country.',
    category: 'Declarations',
    files: { pdf: `${base}/single-country-declaration.pdf`, excel: `${base}/single-country-declaration.xls` },
  },
  {
    id: 'multiple-country-declaration',
    name: 'Multiple Country Declaration',
    description: 'Certificate of origin declaration for shipments containing goods sourced from multiple countries.',
    category: 'Declarations',
    files: { pdf: `${base}/multiple-country-declaration.pdf`, excel: `${base}/multiple-country-declaration.xls` },
  },
  {
    id: 'negative-declaration',
    name: 'Negative Declaration',
    description: 'Declaration confirming a shipment does not contain any restricted, hazardous or prohibited items.',
    category: 'Declarations',
    files: { pdf: `${base}/negative-declaration.pdf`, excel: `${base}/negative-declaration.xls` },
  },
  {
    id: 'msds',
    name: 'MSDS',
    description: 'Material Safety Data Sheet describing the properties and handling of a chemical or hazardous item.',
    category: 'Declarations',
    files: { pdf: `${base}/msds.pdf`, excel: `${base}/msds.xls` },
  },
  {
    id: 'dhl-authority-letter',
    name: 'DHL Authority Letter',
    description: 'Authorisation letter appointing DHL as your customs clearance agent for import and export shipments.',
    category: 'Authority Letters',
    files: { word: `${base}/dhl-authority-letter.docx` },
  },
  {
    id: 'dhl-indemnity-letter',
    name: 'DHL Sanctions & Indemnity Letter',
    description: 'Warranty and indemnity letter covering export-control and sanctions compliance for DHL shipments.',
    category: 'Authority Letters',
    files: { pdf: `${base}/indemnity-letter-dhl.pdf` },
  },
  {
    id: 'fedex-authority-letter',
    name: 'FedEx Authority Letter',
    description: 'Export authorisation and KYC letter appointing FedEx as your customs clearance agent.',
    category: 'Authority Letters',
    files: { pdf: `${base}/fedex-authority-letter.pdf`, excel: `${base}/fedex-authority-letter.xlsx` },
  },
  {
    id: 'ups-authority-letter',
    name: 'UPS Authority Letter',
    description: 'Authority letter appointing UPS to clear export consignments with Indian customs on your behalf.',
    category: 'Authority Letters',
    files: { pdf: `${base}/ups-authority-letter.pdf`, excel: `${base}/ups-authority-letter.xlsx` },
  },
  {
    id: 'awcc-authority-letter',
    name: 'AWCC Authority Letter',
    description: 'Authorisation with KYC letter appointing AW Courier & Cargo for customs clearance and e-way billing.',
    category: 'Authority Letters',
    files: { pdf: `${base}/awcc-authority-letter.pdf`, excel: `${base}/awcc-authority-letter.xlsx` },
  },
  {
    id: 'gr-waiver-repair-return',
    name: 'GR Waiver (Repair & Return)',
    description: 'Waiver declaration for items sent abroad temporarily for repair and intended to be returned.',
    category: 'Others',
    files: { pdf: `${base}/gr-waiver-repair-return.pdf`, excel: `${base}/gr-waiver-repair-return.xls` },
  },
  {
    id: 'gr-waiver-free-trade-sample',
    name: 'GR Waiver (Free Trade Sample)',
    description: 'Waiver declaration for goods exported free of charge as trade samples.',
    category: 'Others',
    files: { pdf: `${base}/gr-waiver-free-trade-sample.pdf`, excel: `${base}/gr-waiver-free-trade-sample.xls` },
  },
  {
    id: 'annexure-c1-eou',
    name: 'Annexure C1 for EOU',
    description: 'Annexure C1 declaration for shipments made by Export Oriented Units.',
    category: 'Others',
    files: { pdf: `${base}/annexure-c1-eou.pdf`, excel: `${base}/annexure-c1-eou.xls` },
  },
  {
    id: 'appendix-ii-deec',
    name: 'Appendix II for DEEC',
    description: 'Appendix II declaration for shipments under the Duty Exemption Entitlement Certificate scheme.',
    category: 'Others',
    files: { pdf: `${base}/appendix-ii-deec.pdf`, excel: `${base}/appendix-ii-deec.xls` },
  },
  {
    id: 'annexure-i-drawback',
    name: 'Annexure I for Drawback',
    description: 'Annexure I declaration filed to claim duty drawback on exported goods.',
    category: 'Others',
    files: { pdf: `${base}/annexure-i-drawback.pdf`, excel: `${base}/annexure-i-drawback.xls` },
  },
  {
    id: 'annexure-ii-drawback',
    name: 'Annexure II for Drawback',
    description: 'Annexure II declaration filed to claim duty drawback on exported goods.',
    category: 'Others',
    files: { pdf: `${base}/annexure-ii-drawback.pdf`, excel: `${base}/annexure-ii-drawback.xls` },
  },
  {
    id: 'appendix-iii-drawback',
    name: 'Appendix III for Drawback',
    description: 'Appendix III declaration filed to claim duty drawback on exported goods.',
    category: 'Others',
    files: { pdf: `${base}/appendix-iii-drawback.pdf`, excel: `${base}/appendix-iii-drawback.xls` },
  },
  {
    id: 'appendix-iv-drawback',
    name: 'Appendix IV for Drawback',
    description: 'Appendix IV declaration filed to claim duty drawback on exported goods.',
    category: 'Others',
    files: { excel: `${base}/appendix-iv-drawback.xls` },
  },
]
