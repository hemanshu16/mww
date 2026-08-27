import { useState } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { FormField, FormTextarea } from '@/components/form-field'
import { SegmentedControl } from '@/components/SegmentedControl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

type PackageType = 'document' | 'parcel' | 'fragile'
type Step = 1 | 2

const PACKAGE_OPTIONS: { value: PackageType; label: string }[] = [
  { value: 'document', label: 'Document' },
  { value: 'parcel', label: 'Parcel' },
  { value: 'fragile', label: 'Fragile' },
]

function CourierBookingPage() {
  const [step, setStep] = useState<Step>(1)
  const [calcDone, setCalcDone] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [packageType, setPackageType] = useState<PackageType>('document')

  function resetFlow() {
    setStep(1)
    setCalcDone(false)
    setConfirmed(false)
  }

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <StatusBadge tone={step === 1 ? 'accent' : 'neutral'}>1 · Rate calculation</StatusBadge>
        <StatusBadge tone={step === 2 ? 'accent' : 'neutral'}>
          2 · Shipper &amp; consignee
        </StatusBadge>
      </div>

      {step === 1 && (
        <>
          <Card className="mb-5 max-w-[720px] gap-4 p-5">
            <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
              Rate calculator
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="From (city / zone)" placeholder="e.g. Mumbai, Zone A" />
              <FormField label="To (city / zone)" placeholder="e.g. Pune, Zone B" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Weight (kg)" placeholder="e.g. 4.5" inputMode="decimal" />
              <FormField label="Dimensions L × W × H (cm)" placeholder="e.g. 30 x 20 x 15" />
            </div>
            <SegmentedControl
              label="Package type"
              options={PACKAGE_OPTIONS}
              value={packageType}
              onChange={setPackageType}
            />
            <Button onClick={() => setCalcDone(true)} className="mt-2 self-start">
              Calculate rate
            </Button>
          </Card>

          {calcDone && (
            <Card className="mb-5 max-w-[720px] gap-4 border-transparent p-5 shadow-elevate">
              <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
                Estimated rate
              </div>
              <div className="overflow-hidden rounded-2xl border border-border">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Chargeable weight</TableCell>
                      <TableCell className="text-right tabular-nums">5.0 kg</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Base rate</TableCell>
                      <TableCell className="text-right tabular-nums">₹410.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Fuel surcharge</TableCell>
                      <TableCell className="text-right tabular-nums">₹42.50</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>GST (18%)</TableCell>
                      <TableCell className="text-right tabular-nums">₹81.45</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold tabular-nums">₹533.95</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <Button onClick={() => setStep(2)} className="self-start">
                Continue to shipper &amp; consignee details
              </Button>
            </Card>
          )}
        </>
      )}

      {step === 2 &&
        (confirmed ? (
          <Card className="max-w-[560px] gap-3 border-transparent p-5 shadow-elevate">
            <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
              Booking confirmed
            </div>
            <div className="font-heading text-[19px]">Reference CB-48291</div>
            <p className="text-sm text-muted-foreground">
              Pickup scheduled. Shipper and consignee will receive tracking updates by SMS and
              email.
            </p>
            <Button variant="secondary" onClick={resetFlow} className="mt-1 self-start">
              Book another shipment
            </Button>
          </Card>
        ) : (
          <>
            <div className="mb-4 grid max-w-[900px] grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="gap-4 p-5">
                <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
                  Shipper details
                </div>
                <FormField label="Name" placeholder="Full name" />
                <FormField label="Phone" type="tel" placeholder="Mobile number" />
                <FormField label="Address" placeholder="Pickup address" />
              </Card>
              <Card className="gap-4 p-5">
                <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
                  Consignee details
                </div>
                <FormField label="Name" placeholder="Full name" />
                <FormField label="Phone" type="tel" placeholder="Mobile number" />
                <FormField label="Address" placeholder="Delivery address" />
              </Card>
            </div>
            <Card className="mb-5 max-w-[900px] gap-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Pickup date & time slot" placeholder="e.g. 25 Aug, 2–5 PM" />
                <FormField label="Reference / order number" placeholder="Optional" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Package description" placeholder="e.g. Electronics, 1 unit" />
                <FormField label="Declared value" placeholder="e.g. ₹4,500" />
              </div>
              <FormTextarea label="Special instructions" placeholder="Optional handling notes" />
            </Card>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setConfirmed(true)}>Confirm booking</Button>
            </div>
          </>
        ))}
    </div>
  )
}

export default CourierBookingPage
