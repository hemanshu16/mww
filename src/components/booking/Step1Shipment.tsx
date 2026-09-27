import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheck, Plus, Trash2 } from 'lucide-react'
import { step1Schema, type Step1FormValues } from '@/lib/bookingSchemas'
import {
  SHIPMENT_TYPES,
  SHIPMENT_TYPE_LABELS,
  type BookingItem,
  type Country,
  type CourierProvider,
} from '@/lib/types'
import { itemsAfterRemovingBox } from '@/lib/bookingMapping'
import { useBookableCountries } from '@/hooks/useCountries'
import { placeLabel, type PostalPlace } from '@/lib/api/postal'
import { CountryCombobox } from '@/components/booking/CountryCombobox'
import { PostalCodeInput } from '@/components/booking/PostalCodeInput'
import { CountryFlag } from '@/components/countries/CountryFlag'
import { RateOptions, type RateStatus } from '@/components/booking/RateOptions'
import { formatMoney, getRates, type RateQuote } from '@/lib/rates'
import { DEFAULT_VOLUMETRIC_DIVISOR, chargeableWeight, volumetricWeight } from '@/lib/weights'
import { formatWeight, todayInput } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
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

export type ProviderOption = Pick<CourierProvider, 'id' | 'name' | 'logoUrl'>

export function Step1Shipment({
  defaultValues,
  providers,
  providersLoading,
  submitting,
  submitLabel,
  onSubmit,
  items: initialItems = [],
  lockDestination = false,
  destinationLabel,
  pricing = 'quote',
  secondaryAction,
}: {
  defaultValues: Step1FormValues
  providers: ProviderOption[]
  providersLoading: boolean
  submitting: boolean
  submitLabel: string
  /** `items` is set only when removing a box renumbered or dropped items. */
  onSubmit: (values: Step1FormValues, items?: BookingItem[]) => void
  /** The draft's declared items (edit mode), so removing a box keeps them consistent. */
  items?: BookingItem[]
  /** Editing: the destination is fixed after the booking is created. */
  lockDestination?: boolean
  /** Name for a locked destination; skips loading the customer country list. */
  destinationLabel?: string
  /** 'quote': pick from rate quotes (customer). 'manual': choose a courier and type the price (admin). */
  pricing?: 'quote' | 'manual'
  /** Extra button under the summary's submit button (e.g. Cancel). */
  secondaryAction?: React.ReactNode
}) {
  const manual = pricing === 'manual'
  const [items, setItems] = useState(initialItems)
  const [itemsChanged, setItemsChanged] = useState(false)
  const [pendingRemoval, setPendingRemoval] = useState<number | null>(null)
  const countriesQuery = useBookableCountries(!(lockDestination && destinationLabel))
  const countries = useMemo(() => countriesQuery.data ?? [], [countriesQuery.data])
  const countryMap = useMemo(() => new Map(countries.map((c) => [c.alpha2, c])), [countries])
  // The resolver is created once, so it reads the latest countries through a ref.
  const countryRef = useRef<Map<string, Country>>(countryMap)
  useEffect(() => {
    countryRef.current = countryMap
  }, [countryMap])

  const schema = useMemo(
    () =>
      step1Schema.superRefine((v, ctx) => {
        // Zip code is required only when the chosen country prices by zip code.
        const c = countryRef.current.get(v.consigneeCountryCode)
        if (!lockDestination && c?.isZipcodeLevelRates && !v.consigneeZipCode) {
          ctx.addIssue({
            code: 'custom',
            path: ['consigneeZipCode'],
            message: `Enter a zip code. Rates for ${c.name} depend on it.`,
          })
        }
        if (manual && (v.totalPrice === null || !(v.totalPrice >= 0))) {
          ctx.addIssue({ code: 'custom', path: ['totalPrice'], message: 'Enter the price' })
        }
      }),
    [lockDestination, manual],
  )

  const form = useForm<Step1FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })
  const [place, setPlace] = useState<PostalPlace | null>(null)
  const [countryCode, zipCode] = useWatch({
    control: form.control,
    name: ['consigneeCountryCode', 'consigneeZipCode'],
  })
  const destination = countryMap.get(countryCode)

  const changeCountry = (alpha2: string) => {
    if (alpha2 === countryCode) return
    form.setValue('consigneeCountryCode', alpha2, { shouldDirty: true, shouldValidate: true })
    form.setValue('consigneeZipCode', '', { shouldDirty: true })
    form.clearErrors('consigneeZipCode')
    setPlace(null)
  }
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'packages' })

  // Removing a box drops its items and renumbers later boxes' items, so the
  // PATCH can send the matching list (the API rejects orphaned items with 409).
  const itemsInBox = (index: number) => items.filter((i) => i.boxNumber === index + 1)
  const removeBox = (index: number) => {
    if (items.some((i) => i.boxNumber > index)) {
      setItems((prev) => itemsAfterRemovingBox(prev, index + 1))
      setItemsChanged(true)
    }
    remove(index)
    setPendingRemoval(null)
  }
  const requestRemoveBox = (index: number) =>
    itemsInBox(index).length ? setPendingRemoval(index) : removeBox(index)
  const submit = (values: Step1FormValues) => onSubmit(values, itemsChanged ? items : undefined)

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

  // --- Rates ----------------------------------------------------------------
  // Quotes are tied to what they were priced on; any change makes them stale.
  const quoteKey = `${countryCode}|${zipCode}|${totals.chg.toFixed(3)}`
  const [quotes, setQuotes] = useState<RateQuote[]>([])
  const [quotedKey, setQuotedKey] = useState<string | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [rateError, setRateError] = useState<string>()
  const selectedProviderId = useWatch({ control: form.control, name: 'courierProviderId' })
  const selectedQuote = quotes.find((q) => q.courierProviderId === selectedProviderId)
  const manualPrice = useWatch({ control: form.control, name: 'totalPrice' })
  const manualProvider = providers.find((p) => p.id === selectedProviderId)

  const rateStatus: RateStatus = quoting
    ? 'loading'
    : quotedKey === null
      ? 'idle'
      : quotedKey === quoteKey
        ? 'ready'
        : 'stale'

  // A price chosen for the old destination/weight no longer applies.
  useEffect(() => {
    if (!manual && rateStatus === 'stale' && form.getValues('courierProviderId')) {
      form.setValue('courierProviderId', '')
      form.setValue('ratePerKg', null)
      form.setValue('totalPrice', null)
    }
  }, [manual, rateStatus, form])

  const selectQuote = (q: RateQuote) => {
    form.setValue('courierProviderId', q.courierProviderId, { shouldDirty: true })
    form.setValue('ratePerKg', q.ratePerKg, { shouldDirty: true })
    form.setValue('totalPrice', q.totalPrice, { shouldDirty: true })
    form.clearErrors('courierProviderId')
  }

  const fetchRates = async (keepProviderId?: string) => {
    setRateError(undefined)
    if (providers.length === 0) {
      setRateError(
        providersLoading
          ? 'Couriers are still loading. Try again in a moment.'
          : 'No couriers are available.',
      )
      return
    }
    const key = quoteKey
    setQuoting(true)
    try {
      const result = await getRates(providers, {
        countryCode,
        zipCode: zipCode || undefined,
        chargeableWeight: Number(totals.chg.toFixed(3)),
      })
      setQuotes(result)
      setQuotedKey(key)
      const keep = result.find((q) => q.courierProviderId === keepProviderId)
      if (keep) selectQuote(keep)
      else form.setValue('courierProviderId', '')
    } catch {
      setRateError('Rates could not be loaded. Try again.')
    } finally {
      setQuoting(false)
    }
  }

  const onGetRates = async () => {
    const ok = await form.trigger(['consigneeCountryCode', 'consigneeZipCode', 'packages'])
    if (!ok) {
      setRateError('Complete the destination and box details first.')
      return
    }
    await fetchRates(form.getValues('courierProviderId'))
  }

  // Editing a draft: re-quote once couriers load so the saved choice shows as selected.
  const autoQuoted = useRef(false)
  useEffect(() => {
    if (
      manual ||
      autoQuoted.current ||
      !defaultValues.courierProviderId ||
      providers.length === 0
    ) {
      return
    }
    autoQuoted.current = true
    void fetchRates(defaultValues.courierProviderId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="grid gap-6 lg:grid-cols-3" noValidate>
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div>
                <h2 className="font-heading text-lg">Destination</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lockDestination
                    ? "The destination can't be changed after the booking is created."
                    : 'Where the shipment is delivered. Rates are based on it.'}
                </p>
              </div>
              {lockDestination ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Destination country</p>
                    <div className="flex h-11 items-center gap-2 rounded-[8px] border border-border bg-[#f8fafc] px-3 text-sm">
                      {destination && (
                        <CountryFlag
                          flagUrl={destination.flagUrl}
                          alpha2={destination.alpha2}
                          className="h-[15px] w-5"
                        />
                      )}
                      <span className="truncate">
                        {destination?.name ?? destinationLabel ?? (countryCode || '—')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Destination zip code</p>
                    <div className="flex h-11 items-center rounded-[8px] border border-border bg-[#f8fafc] px-3 font-mono text-sm">
                      {zipCode || (
                        <span className="font-sans text-muted-foreground">Not needed</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="consigneeCountryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Destination country</FormLabel>
                        <FormControl>
                          <CountryCombobox
                            value={field.value}
                            onChange={changeCountry}
                            onBlur={field.onBlur}
                            countries={countries}
                            loading={countriesQuery.isLoading}
                            error={countriesQuery.isError}
                          />
                        </FormControl>
                        {countriesQuery.isError ? (
                          <p className="text-xs font-medium text-destructive">
                            Countries didn&apos;t load.{' '}
                            <button
                              type="button"
                              onClick={() => countriesQuery.refetch()}
                              className="underline underline-offset-2"
                            >
                              Try again
                            </button>
                          </p>
                        ) : (
                          <FormMessage />
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consigneeZipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required={!!destination?.isZipcodeLevelRates}>
                          Destination zip code
                        </FormLabel>
                        {!destination ? (
                          <div className="flex h-11 items-center rounded-[8px] border border-dashed border-[#d5dde8] bg-[#f8fafc] px-3 text-sm text-[#9aa8ba]">
                            Choose a country first
                          </div>
                        ) : !destination.isZipcodeLevelRates ? (
                          <>
                            <div className="flex h-11 items-center rounded-[8px] border border-dashed border-[#d5dde8] bg-[#f8fafc] px-3 text-sm text-[#526581]">
                              Not needed
                            </div>
                            <FormDescription>
                              {destination.name} has one rate for the whole country.
                            </FormDescription>
                          </>
                        ) : (
                          <>
                            <FormControl>
                              <PostalCodeInput
                                countryCode={destination.alpha2}
                                countryName={destination.name}
                                value={field.value}
                                onChange={field.onChange}
                                onPlaceChange={setPlace}
                                onBlur={field.onBlur}
                              />
                            </FormControl>
                            {form.formState.errors.consigneeZipCode ? (
                              <FormMessage />
                            ) : place && place.postalCode === field.value ? (
                              <p className="flex items-center gap-1.5 text-xs text-[#047857]">
                                <CircleCheck className="size-3.5" />
                                {placeLabel(place)}
                              </p>
                            ) : (
                              <FormDescription>Search by city name or zip code.</FormDescription>
                            )}
                          </>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6">
              <h2 className="font-heading text-lg">Shipment</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <div
                      key={fieldItem.id}
                      className="rounded-lg border border-border bg-muted/30 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold">Box {index + 1}</span>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => requestRemoveBox(index)}
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
                                <Input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  placeholder="0.0"
                                  {...field}
                                />
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
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  placeholder="0"
                                  {...field}
                                />
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
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  placeholder="0"
                                  {...field}
                                />
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
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  placeholder="0"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Volumetric:{' '}
                          <span className="font-semibold text-foreground">{formatWeight(vol)}</span>
                        </span>
                        <span>
                          Chargeable:{' '}
                          <span className="font-semibold text-primary">{formatWeight(chg)}</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="font-heading text-lg">Courier &amp; {manual ? 'price' : 'rate'}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {manual
                    ? 'Choose the courier and set the price charged for this booking.'
                    : 'Compare prices for this shipment and choose a courier.'}
                </p>
              </div>
              {manual ? (
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="courierProviderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Courier</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  providersLoading ? 'Loading couriers…' : 'Select courier'
                                }
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
                    name="totalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Price (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={field.value ?? ''}
                            onBlur={field.onBlur}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? null : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <RateOptions
                  status={rateStatus}
                  quotes={quotes}
                  selectedId={selectedProviderId}
                  onSelect={selectQuote}
                  onGetRates={onGetRates}
                  destinationName={destination?.name}
                  error={rateError ?? form.formState.errors.courierProviderId?.message}
                />
              )}
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
                  <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                    <dt className="text-muted-foreground">Destination</dt>
                    <dd className="min-w-0 text-right">
                      {destination ? (
                        <>
                          <span className="flex items-center justify-end gap-2 font-semibold">
                            <CountryFlag
                              flagUrl={destination.flagUrl}
                              alpha2={destination.alpha2}
                              className="h-[15px] w-5"
                            />
                            <span className="truncate">{destination.name}</span>
                          </span>
                          {/* Skip half-typed city searches; show a picked place or a typed code. */}
                          {(place?.postalCode === zipCode || /\d/.test(zipCode)) && (
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {zipCode}
                              {place && place.postalCode === zipCode ? `, ${place.placeName}` : ''}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[#aab5c4]">Not set</span>
                      )}
                    </dd>
                  </div>
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
                  <div className="flex justify-between">
                    <dt className="font-medium">Total chargeable</dt>
                    <dd className="font-semibold tabular-nums text-foreground">
                      {formatWeight(totals.chg)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-t border-border pt-3">
                    <dt className="text-muted-foreground">Courier</dt>
                    <dd className="min-w-0 truncate text-right font-semibold">
                      {manual && manualProvider ? (
                        manualProvider.name
                      ) : !manual && selectedQuote && rateStatus === 'ready' ? (
                        selectedQuote.providerName
                      ) : (
                        <span className="font-normal text-[#aab5c4]">Not chosen</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-medium">Price</dt>
                    <dd className="text-right">
                      {manual ? (
                        manualPrice != null && manualPrice >= 0 ? (
                          <span className="block text-[22px] font-bold leading-7 tracking-[-0.02em] text-primary tabular-nums">
                            {formatMoney(manualPrice)}
                          </span>
                        ) : (
                          <span className="text-[#aab5c4]">Not set</span>
                        )
                      ) : selectedQuote && rateStatus === 'ready' ? (
                        <>
                          <span className="block text-[22px] font-bold leading-7 tracking-[-0.02em] text-primary tabular-nums">
                            {formatMoney(selectedQuote.totalPrice)}
                          </span>
                          <span className="block text-xs tabular-nums text-muted-foreground">
                            {formatMoney(selectedQuote.ratePerKg)} per kg
                          </span>
                        </>
                      ) : (
                        <span className="text-[#aab5c4]">Get rates</span>
                      )}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">
                  Priced on chargeable weight: the greater of actual and volumetric weight.
                </p>
                <Button type="submit" className="w-full" loading={submitting}>
                  {submitLabel}
                </Button>
                {secondaryAction}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <Dialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
      >
        <DialogContent className="max-w-md">
          {pendingRemoval !== null && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  Remove box {pendingRemoval + 1}?
                </DialogTitle>
                <DialogDescription>
                  Its {itemsInBox(pendingRemoval).length === 1 ? 'item is' : 'items are'} removed
                  too.
                  {pendingRemoval + 1 < fields.length &&
                    ` Boxes after it move up one number, and their items move with them.`}
                </DialogDescription>
              </DialogHeader>
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-[10px] bg-[#f8fafc] px-4 py-3 text-sm text-[#526581]">
                {itemsInBox(pendingRemoval).map((i) => (
                  <li key={i.id} className="flex justify-between gap-4">
                    <span className="truncate">{i.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      × {i.quantity}
                    </span>
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setPendingRemoval(null)}>
                  Keep box
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeBox(pendingRemoval)}
                >
                  Remove box and items
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Form>
  )
}
