import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { step1Schema, type Step1FormValues } from '@/lib/bookingSchemas'
import { SHIPMENT_TYPES, SHIPMENT_TYPE_LABELS, type CourierProvider } from '@/lib/types'
import { DEFAULT_VOLUMETRIC_DIVISOR, chargeableWeight, volumetricWeight } from '@/lib/weights'
import { formatWeight, todayInput } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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

const emptyPackage = {
  actualWeight: '',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  volumetricDivisor: '',
}

export function Step1Shipment({
  defaultValues,
  providers,
  providersLoading,
  submitting,
  submitLabel,
  onSubmit,
}: {
  defaultValues: Step1FormValues
  providers: CourierProvider[]
  providersLoading: boolean
  submitting: boolean
  submitLabel: string
  onSubmit: (values: Step1FormValues) => void
}) {
  const form = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues,
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'packages' })

  const watched = form.watch('packages')
  const totals = (watched ?? []).reduce(
    (acc, p) => {
      const vol = volumetricWeight(
        Number(p?.lengthCm),
        Number(p?.widthCm),
        Number(p?.heightCm),
        p?.volumetricDivisor ? Number(p.volumetricDivisor) : DEFAULT_VOLUMETRIC_DIVISOR,
      )
      const chg = chargeableWeight(Number(p?.actualWeight), vol)
      acc.actual += Number(p?.actualWeight) || 0
      acc.vol += vol
      acc.chg += chg
      return acc
    },
    { actual: 0, vol: 0, chg: 0 },
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3" noValidate>
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-5 p-6">
              <h2 className="font-heading text-lg">Shipment</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="courierProviderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Courier provider</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={providersLoading ? 'Loading…' : 'Select provider'}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providers.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
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
                  name="shipmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Shipment type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SHIPMENT_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {SHIPMENT_TYPE_LABELS[t]}
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
                  name="shipmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Shipment date</FormLabel>
                      <FormControl>
                        <Input type="date" min={todayInput()} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference number</FormLabel>
                      <FormControl>
                        <Input placeholder="REF-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Fragile, handle with care…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg">Packages</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ ...emptyPackage })}
                >
                  <Plus className="size-4" /> Add box
                </Button>
              </div>

              {typeof form.formState.errors.packages?.message === 'string' && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.packages.message}
                </p>
              )}

              <div className="space-y-4">
                {fields.map((fieldItem, index) => {
                  const p = watched?.[index]
                  const vol = volumetricWeight(
                    Number(p?.lengthCm),
                    Number(p?.widthCm),
                    Number(p?.heightCm),
                    p?.volumetricDivisor ? Number(p.volumetricDivisor) : DEFAULT_VOLUMETRIC_DIVISOR,
                  )
                  const chg = chargeableWeight(Number(p?.actualWeight), vol)
                  return (
                    <div key={fieldItem.id} className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold">Box {index + 1}</span>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                            aria-label={`Remove box ${index + 1}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <FormField
                          control={form.control}
                          name={`packages.${index}.actualWeight`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Actual (kg)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.001" min="0" placeholder="0.0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`packages.${index}.lengthCm`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Length (cm)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" min="0" placeholder="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`packages.${index}.widthCm`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Width (cm)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" min="0" placeholder="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`packages.${index}.heightCm`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Height (cm)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" min="0" placeholder="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Volumetric: <span className="font-semibold text-foreground">{formatWeight(vol)}</span>
                        </span>
                        <span>
                          Chargeable: <span className="font-semibold text-primary">{formatWeight(chg)}</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky summary */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <Card>
              <CardContent className="space-y-4 p-6">
                <h2 className="font-heading text-lg">Summary</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Boxes</dt>
                    <dd className="font-semibold tabular-nums">{fields.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Total actual</dt>
                    <dd className="font-semibold tabular-nums">{formatWeight(totals.actual)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Total volumetric</dt>
                    <dd className="font-semibold tabular-nums">{formatWeight(totals.vol)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3">
                    <dt className="font-medium">Total chargeable</dt>
                    <dd className="font-heading text-lg text-primary tabular-nums">
                      {formatWeight(totals.chg)}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">
                  Chargeable weight is the greater of actual and volumetric weight. Final values are
                  confirmed by the server on save.
                </p>
                <Button type="submit" className="w-full" loading={submitting}>
                  {submitLabel}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}
