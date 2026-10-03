import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PackagePlus, User, Warehouse } from 'lucide-react'
import { step2Schema, type Step2FormValues } from '@/lib/bookingSchemas'
import { INVOICE_TYPES, INVOICE_TYPE_LABELS, KYC_TYPES, KYC_TYPE_LABELS } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddressFields } from '@/components/booking/AddressFields'
import { KycUploader } from '@/components/booking/KycUploader'
import { ItemsCard } from '@/components/booking/ItemsCard'
import type { Package } from '@/lib/types'

export type PartiesIntent = 'continue' | 'later'

/** KYC as text only: staff can't upload or open the stored files. */
function KycReadOnly({ values }: { values: Step2FormValues['shipper'] }) {
  const docs = (paths: (string | undefined)[]) => paths.filter(Boolean).length
  const block = (
    n: 1 | 2,
    type: string | undefined,
    num: string | undefined,
    fileCount: number,
  ) => (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-3">
      <div>
        <p className="text-xs text-muted-foreground">KYC {n} type</p>
        <p className="mt-0.5 text-sm">
          {type ? KYC_TYPE_LABELS[type as keyof typeof KYC_TYPE_LABELS] : '—'}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">KYC {n} number</p>
        <p className="mt-0.5 text-sm">{num || '—'}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Documents</p>
        <p className="mt-0.5 text-sm">
          {fileCount ? `${fileCount} on file` : <span className="text-muted-foreground">None</span>}
        </p>
      </div>
    </div>
  )
  return (
    <div className="space-y-3">
      {block(
        1,
        values.kyc1Type,
        values.kyc1Number,
        docs([values.kyc1DocFront, values.kyc1DocBack]),
      )}
      {block(2, values.kyc2Type, values.kyc2Number, docs([values.kyc2Doc]))}
      <p className="text-xs text-muted-foreground">
        Edit KYC details and documents from the booking&apos;s detail page.
      </p>
    </div>
  )
}

export function Step2Parties({
  defaultValues,
  packages,
  submitting,
  onSubmit,
  onBack,
  kycReadOnly = false,
  layout = 'wizard',
}: {
  defaultValues: Step2FormValues
  packages: Package[]
  submitting: boolean
  onSubmit: (values: Step2FormValues, intent: PartiesIntent) => void
  onBack: () => void
  /** Show KYC as read-only text, without uploads or file previews. */
  kycReadOnly?: boolean
  /** 'wizard': Back / Save & finish later / Save & continue. 'edit': Cancel / Save changes. */
  layout?: 'wizard' | 'edit'
}) {
  const form = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues,
  })
  const intent = useRef<PartiesIntent>('continue')

  const submit = (i: PartiesIntent) => {
    intent.current = i
    return form.handleSubmit((values) => onSubmit(values, intent.current))()
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Shipper */}
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-2">
                <Warehouse className="size-5 text-primary" />
                <h2 className="font-heading text-lg">Sender (Shipper)</h2>
              </div>
              <AddressFields party="shipper" />

              <Separator />
              <h3 className="text-sm font-semibold">KYC documents</h3>

              {kycReadOnly ? (
                <KycReadOnly values={defaultValues.shipper} />
              ) : (
                <>
                  {/* KYC 1 */}
                  <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="shipper.kyc1Type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>KYC 1 type</FormLabel>
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {KYC_TYPES.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {KYC_TYPE_LABELS[t]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shipper.kyc1Number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>KYC 1 number</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <KycUploader
                        label="Document front"
                        value={form.watch('shipper.kyc1DocFront')}
                        onChange={(v) =>
                          form.setValue('shipper.kyc1DocFront', v, { shouldDirty: true })
                        }
                      />
                      <KycUploader
                        label="Document back"
                        value={form.watch('shipper.kyc1DocBack')}
                        onChange={(v) =>
                          form.setValue('shipper.kyc1DocBack', v, { shouldDirty: true })
                        }
                      />
                    </div>
                  </div>

                  {/* KYC 2 */}
                  <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="shipper.kyc2Type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>KYC 2 type</FormLabel>
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {KYC_TYPES.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {KYC_TYPE_LABELS[t]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shipper.kyc2Number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>KYC 2 number</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <KycUploader
                      label="Document"
                      value={form.watch('shipper.kyc2Doc')}
                      onChange={(v) => form.setValue('shipper.kyc2Doc', v, { shouldDirty: true })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Consignee + invoice */}
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-2">
                <User className="size-5 text-primary" />
                <h2 className="font-heading text-lg">Receiver (Consignee)</h2>
              </div>
              <AddressFields party="consignee" />
              <FormField
                control={form.control}
                name="consignee.note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery note</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Leave at reception…"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />
              <div className="flex items-center gap-2">
                <PackagePlus className="size-5 text-primary" />
                <h3 className="text-sm font-semibold">Commercial invoice</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="invoice.invoiceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice type</FormLabel>
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INVOICE_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {INVOICE_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoice.currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="USD"
                          maxLength={3}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoice.invoiceNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice no.</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoice.invoiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="invoice.invoiceTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice terms</FormLabel>
                    <FormControl>
                      <Input placeholder="FOB" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <ItemsCard packages={packages} />

        {layout === 'edit' ? (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" onClick={() => submit('continue')} loading={submitting}>
              Save changes
            </Button>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
              Back
            </Button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => submit('later')}
                disabled={submitting}
              >
                Save &amp; finish later
              </Button>
              <Button type="button" onClick={() => submit('continue')} loading={submitting}>
                Save &amp; continue
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  )
}
