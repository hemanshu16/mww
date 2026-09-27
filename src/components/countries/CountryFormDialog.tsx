import { useEffect } from 'react'
import { useForm, useWatch, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreateCountry, useUpdateCountry } from '@/hooks/useCountries'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import { CountryFlag } from '@/components/countries/CountryFlag'
import { cn } from '@/lib/utils'
import type { Country, CountryInput } from '@/lib/types'

const countrySchema = z.object({
  name: z.string().trim().min(1, 'Enter the country name'),
  alpha2: z.string().regex(/^[A-Z]{2}$/, 'Use exactly 2 letters, like IN'),
  alpha3: z.string().regex(/^[A-Z]{3}$/, 'Use exactly 3 letters, like IND'),
  region: z.string().trim(),
  subregion: z.string().trim(),
  flagUrl: z
    .string()
    .trim()
    .refine((v) => v === '' || z.url().safeParse(v).success, 'Enter a full URL starting with https://'),
  isVisible: z.boolean(),
  isZipcodeLevelRates: z.boolean(),
})
type CountryValues = z.infer<typeof countrySchema>

const EMPTY: CountryValues = {
  name: '',
  alpha2: '',
  alpha3: '',
  region: '',
  subregion: '',
  flagUrl: '',
  isVisible: true,
  isZipcodeLevelRates: true,
}

function toValues(c: Country): CountryValues {
  return {
    name: c.name,
    alpha2: c.alpha2,
    alpha3: c.alpha3,
    region: c.region ?? '',
    subregion: c.subregion ?? '',
    flagUrl: c.flagUrl ?? '',
    isVisible: c.isVisible,
    isZipcodeLevelRates: c.isZipcodeLevelRates,
  }
}

/** Blank optional text fields become null so PATCH clears them. */
function toPayload(v: CountryValues): CountryInput {
  return {
    name: v.name.trim(),
    alpha2: v.alpha2,
    alpha3: v.alpha3,
    region: v.region || null,
    subregion: v.subregion || null,
    flagUrl: v.flagUrl || null,
    isVisible: v.isVisible,
    isZipcodeLevelRates: v.isZipcodeLevelRates,
  }
}

function changedFields(before: CountryInput, after: CountryInput): Partial<CountryInput> {
  const diff: Partial<CountryInput> = {}
  for (const key of Object.keys(after) as (keyof CountryInput)[]) {
    if (after[key] !== before[key]) (diff as Record<string, unknown>)[key] = after[key]
  }
  return diff
}

function Preview({ control }: { control: Control<CountryValues> }) {
  const [name, alpha2, alpha3, region, subregion, flagUrl, isVisible] = useWatch({
    control,
    name: ['name', 'alpha2', 'alpha3', 'region', 'subregion', 'flagUrl', 'isVisible'],
  })
  const place = [subregion, region].filter(Boolean).join(', ')

  return (
    <div className="flex items-center gap-4 rounded-[12px] border border-border bg-[#f8fafc] p-4">
      <CountryFlag flagUrl={flagUrl} alpha2={alpha2} size="lg" />
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-[15px] font-semibold', name ? 'text-foreground' : 'text-[#aab5c4]')}>
          {name || 'Country name'}
        </p>
        <p className="truncate text-sm text-muted-foreground">{place || 'No region yet'}</p>
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
        <span className="rounded-[6px] bg-card px-2 py-0.5 text-xs font-semibold tabular-nums tracking-wide text-[#526581] ring-1 ring-inset ring-border">
          {alpha2 || '––'} / {alpha3 || '–––'}
        </span>
        <span className={cn('text-xs', isVisible ? 'text-[#047857]' : 'text-[#8291a8]')}>
          {isVisible ? 'Shown to customers' : 'Hidden from customers'}
        </span>
      </div>
    </div>
  )
}

function ToggleRow({
  control,
  name,
  label,
  description,
}: {
  control: Control<CountryValues>
  name: 'isVisible' | 'isZipcodeLevelRates'
  label: string
  description: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-start justify-between gap-6 space-y-0 py-4">
          <div className="space-y-1">
            <FormLabel>{label}</FormLabel>
            <FormDescription className="text-[13px]">{description}</FormDescription>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export function CountryFormDialog({
  open,
  onOpenChange,
  country,
  regions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present when editing; absent when adding. */
  country?: Country | null
  /** Regions already in use, offered as one-click suggestions. */
  regions: string[]
}) {
  const isEdit = !!country
  const create = useCreateCountry()
  const update = useUpdateCountry()
  const form = useForm<CountryValues>({
    resolver: zodResolver(countrySchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) form.reset(country ? toValues(country) : EMPTY)
  }, [open, country, form])

  const region = useWatch({ control: form.control, name: 'region' })

  const onSubmit = async (values: CountryValues) => {
    const payload = toPayload(values)
    try {
      if (country) {
        const diff = changedFields(toPayload(toValues(country)), payload)
        if (Object.keys(diff).length === 0) return onOpenChange(false)
        await update.mutateAsync({ id: country.id, input: diff })
        toast.success(`${payload.name} updated.`)
      } else {
        await create.mutateAsync(payload)
        toast.success(`${payload.name} added.`)
      }
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiRequestError && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field in EMPTY) form.setError(field as keyof CountryValues, { message })
        }
      }
      toast.error(getApiErrorMessage(error, isEdit ? 'Could not save changes.' : 'Could not add country.'))
    }
  }

  const upper = (max: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    e.target.value.replace(/[^a-z]/gi, '').slice(0, max).toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl gap-0 overflow-y-auto p-0">
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle className="text-lg font-semibold">
            {isEdit ? `Edit ${country.name}` : 'Add country'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Changes apply to new bookings straight away.'
              : 'Add a destination customers can book shipments to.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="space-y-5 px-6 pb-6">
              <Preview control={form.control} />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Country name</FormLabel>
                    <FormControl>
                      <Input placeholder="India" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="alpha2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>2-letter code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="IN"
                          autoComplete="off"
                          className="font-semibold tracking-[0.08em]"
                          {...field}
                          onChange={(e) => field.onChange(upper(2)(e))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="alpha3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>3-letter code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="IND"
                          autoComplete="off"
                          className="font-semibold tracking-[0.08em]"
                          {...field}
                          onChange={(e) => field.onChange(upper(3)(e))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <FormControl>
                        <Input placeholder="Asia" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subregion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subregion</FormLabel>
                      <FormControl>
                        <Input placeholder="Southern Asia" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {regions.length > 0 && (
                <div className="-mt-2 flex flex-wrap gap-1.5">
                  {regions.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => form.setValue('region', r, { shouldDirty: true, shouldValidate: true })}
                      className={cn(
                        'h-7 rounded-full border px-2.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25',
                        region === r
                          ? 'border-transparent bg-[#eff6ff] text-[#21649c]'
                          : 'border-border text-muted-foreground hover:border-[#b9c9da] hover:text-foreground',
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}

              <FormField
                control={form.control}
                name="flagUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flag image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://flagcdn.com/in.svg" autoComplete="off" {...field} />
                    </FormControl>
                    <FormDescription>SVG or PNG. Leave blank to show the 2-letter code.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="divide-y divide-[#edf1f6] border-y border-[#edf1f6]">
                <ToggleRow
                  control={form.control}
                  name="isVisible"
                  label="Show to customers"
                  description="Customers can pick this country as a destination when they book."
                />
                <ToggleRow
                  control={form.control}
                  name="isZipcodeLevelRates"
                  label="Price by zip code"
                  description="Rates vary by destination postal code. Turn off to use one rate for the whole country."
                />
              </div>
            </div>

            <DialogFooter className="border-t border-border bg-[#f8fafc] px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={form.formState.isSubmitting}
                disabled={isEdit && !form.formState.isDirty}
              >
                {isEdit ? 'Save changes' : 'Add country'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
