import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { KycDocLink } from '@/components/booking/KycDocLink'
import { formatDate, formatDimensions, formatWeight } from '@/lib/format'
import {
  INVOICE_TYPE_LABELS,
  KYC_TYPE_LABELS,
  SHIPMENT_TYPE_LABELS,
  type Booking,
  type Consignee,
  type Shipper,
} from '@/lib/types'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value || '—'}</dd>
    </div>
  )
}

function AddressBlock({ party }: { party: Shipper | Consignee }) {
  const lines = [party.address1, party.address2, party.address3].filter(Boolean)
  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium">{party.fullName}</p>
        {party.attention && <p className="text-sm text-muted-foreground">Attn: {party.attention}</p>}
      </div>
      <div className="text-sm">
        {lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
        <p>
          {[party.city, party.state, party.zipCode].filter(Boolean).join(', ')}
        </p>
        <p className="font-medium">{party.country}</p>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <Field label="Phone" value={party.phoneNo} />
        {party.phoneNoAlt && <Field label="Alt. phone" value={party.phoneNoAlt} />}
        {party.email && <Field label="Email" value={party.email} />}
        {party.reference && <Field label="Reference" value={party.reference} />}
      </dl>
    </div>
  )
}

export function BookingRecap({ booking }: { booking: Booking }) {
  const { shipper, consignee, invoice, packages, summary } = booking

  return (
    <div className="space-y-6">
      {/* Shipment */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Type" value={SHIPMENT_TYPE_LABELS[booking.shipmentType]} />
            <Field label="Shipment date" value={formatDate(booking.shipmentDate)} />
            <Field label="Reference" value={booking.referenceNumber} />
            <Field label="Remarks" value={booking.remarks} />
          </dl>
        </CardContent>
      </Card>

      {/* Packages */}
      <Card>
        <CardHeader>
          <CardTitle>Packages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Box</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Volumetric</TableHead>
                <TableHead className="text-right">Chargeable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((p, i) => (
                <TableRow key={p.id} className="hover:bg-transparent">
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDimensions(p.lengthCm, p.widthCm, p.heightCm)}
                    <span className="ml-1 text-xs">(÷{p.volumetricDivisor})</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatWeight(p.actualWeight)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatWeight(p.volumetricWeight)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatWeight(p.chargeableWeight)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-wrap justify-end gap-x-8 gap-y-2 border-t border-border p-4 text-sm">
            <span className="text-muted-foreground">
              Boxes: <span className="font-semibold text-foreground">{summary.boxCount}</span>
            </span>
            <span className="text-muted-foreground">
              Actual: <span className="font-semibold text-foreground">{formatWeight(summary.totalActualWeight)}</span>
            </span>
            <span className="text-muted-foreground">
              Volumetric:{' '}
              <span className="font-semibold text-foreground">{formatWeight(summary.totalVolumetricWeight)}</span>
            </span>
            <span className="text-muted-foreground">
              Chargeable:{' '}
              <span className="font-semibold text-primary">{formatWeight(summary.totalChargeableWeight)}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Parties */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sender (Shipper)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {shipper ? (
              <>
                <AddressBlock party={shipper} />
                {(shipper.kyc1Type || shipper.kyc2Type || shipper.kyc1DocFront || shipper.kyc2Doc) && (
                  <div className="space-y-4 border-t border-border pt-4">
                    <h4 className="text-sm font-semibold">KYC documents</h4>
                    {(shipper.kyc1Type || shipper.kyc1Number) && (
                      <div>
                        <dl className="grid grid-cols-2 gap-3">
                          <Field
                            label="KYC 1 type"
                            value={shipper.kyc1Type ? KYC_TYPE_LABELS[shipper.kyc1Type] : null}
                          />
                          <Field label="KYC 1 number" value={shipper.kyc1Number} />
                        </dl>
                        {(shipper.kyc1DocFront || shipper.kyc1DocBack) && (
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            {shipper.kyc1DocFront && <KycDocLink label="Front" path={shipper.kyc1DocFront} />}
                            {shipper.kyc1DocBack && <KycDocLink label="Back" path={shipper.kyc1DocBack} />}
                          </div>
                        )}
                      </div>
                    )}
                    {(shipper.kyc2Type || shipper.kyc2Number) && (
                      <div>
                        <dl className="grid grid-cols-2 gap-3">
                          <Field
                            label="KYC 2 type"
                            value={shipper.kyc2Type ? KYC_TYPE_LABELS[shipper.kyc2Type] : null}
                          />
                          <Field label="KYC 2 number" value={shipper.kyc2Number} />
                        </dl>
                        {shipper.kyc2Doc && (
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <KycDocLink label="Document" path={shipper.kyc2Doc} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not provided yet.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receiver (Consignee)</CardTitle>
            </CardHeader>
            <CardContent>
              {consignee ? (
                <div className="space-y-4">
                  <AddressBlock party={consignee} />
                  {consignee.note && (
                    <div className="border-t border-border pt-4">
                      <Field label="Delivery note" value={consignee.note} />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not provided yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice ? (
                <dl className="grid grid-cols-2 gap-4">
                  <Field label="Type" value={INVOICE_TYPE_LABELS[invoice.invoiceType]} />
                  <Field label="Currency" value={invoice.currency} />
                  <Field label="Invoice no." value={invoice.invoiceNo} />
                  <Field label="Invoice date" value={formatDate(invoice.invoiceDate)} />
                  <Field label="Terms" value={invoice.invoiceTerms} />
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">No invoice added.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
