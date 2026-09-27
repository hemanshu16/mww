import { useEffect, useRef } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { Flag, PackageOpen, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { Step2FormValues } from '@/lib/bookingSchemas'
import { emptyItem } from '@/lib/bookingMapping'
import { formatDimensions, formatWeight } from '@/lib/format'
import type { Package } from '@/lib/types'
import { cn } from '@/lib/utils'

// Name | HSN | Qty | Unit price | Weight | Priority | Remove
const ROW_GRID =
  'grid grid-cols-2 gap-x-3 gap-y-3 md:grid-cols-[minmax(0,1fr)_112px_76px_124px_108px_40px_40px] md:items-start md:gap-y-0'

const number = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function money(n: number, currency: string) {
  return currency ? `${number.format(n)} ${currency}` : number.format(n)
}

/** Keeps number-ish text inputs to digits (and one dot when decimals are allowed). */
function clean(value: string, decimals: boolean) {
  const digits = value.replace(decimals ? /[^\d.]/g : /\D/g, '')
  if (!decimals) return digits
  const [whole, ...rest] = digits.split('.')
  return rest.length ? `${whole}.${rest.join('')}` : whole
}

/**
 * Declared contents, grouped by box. Rows live in one flat `items` array (the
 * API's replace-all list); each row carries the box it belongs to.
 */
export function ItemsCard({ packages }: { packages: Package[] }) {
  const { control } = useFormContext<Step2FormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = useWatch({ control, name: 'items' }) ?? []
  const currency = (useWatch({ control, name: 'invoice.currency' }) ?? '').trim().toUpperCase()

  const lineValue = (i: number) => Number(items[i]?.quantity) * Number(items[i]?.price) || 0
  const totalValue = items.reduce((sum, _, i) => sum + lineValue(i), 0)
  const boxes = packages.length ? packages : []

  // Focus the new row's name once it has mounted.
  const focusIndex = useRef<number | null>(null)
  useEffect(() => {
    if (focusIndex.current === null) return
    document.querySelector<HTMLInputElement>(`input[name="items.${focusIndex.current}.name"]`)?.focus()
    focusIndex.current = null
  }, [fields.length])

  const addItem = (boxNumber: number) => {
    focusIndex.current = fields.length
    append(emptyItem(boxNumber), { shouldFocus: false })
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-lg">Items</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              List what&apos;s inside each box. Customs uses these details to clear the shipment.
            </p>
          </div>
          {items.length > 0 && (
            <dl className="flex gap-6 text-right text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Items</dt>
                <dd className="font-semibold tabular-nums">{items.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Declared value</dt>
                <dd className="font-semibold tabular-nums">{money(totalValue, currency)}</dd>
              </div>
            </dl>
          )}
        </div>

        {boxes.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-[#d5dde8] bg-[#f8fafc] px-5 py-6 text-center text-sm text-muted-foreground">
            Add boxes in step 1 before listing items.
          </p>
        ) : (
          <div className="space-y-4">
            {boxes.map((pkg, b) => {
              const boxNumber = pkg.boxNumber ?? b + 1
              // Group by `fields` (not watched values, which lag a render behind appends).
              const rows = fields
                .map((f, index) => ({ f, index }))
                .filter(({ f }) => f.boxNumber === boxNumber)
              const boxValue = rows.reduce((s, { index }) => s + lineValue(index), 0)
              const boxGrams = rows.reduce(
                (s, { index }) => s + (Number(items[index]?.weight) || 0) * (Number(items[index]?.quantity) || 0),
                0,
              )

              return (
                <section
                  key={pkg.id}
                  aria-labelledby={`box-${boxNumber}-title`}
                  className="overflow-hidden rounded-[12px] border border-border"
                >
                  <header className="flex items-center justify-between gap-3 border-b border-border bg-[#f8fafc] px-4 py-3">
                    <div className="flex min-w-0 items-baseline gap-3">
                      <h3 id={`box-${boxNumber}-title`} className="text-sm font-semibold text-foreground">
                        Box {boxNumber}
                      </h3>
                      <span className="truncate text-xs tabular-nums text-muted-foreground">
                        {formatDimensions(pkg.lengthCm, pkg.widthCm, pkg.heightCm)}, {formatWeight(pkg.actualWeight)}
                      </span>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => addItem(boxNumber)}>
                      <Plus /> Add item
                    </Button>
                  </header>

                  {rows.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => addItem(boxNumber)}
                      className="flex w-full items-center gap-3 px-4 py-5 text-left text-sm text-muted-foreground transition-colors duration-150 hover:bg-[#f8fafc] focus-visible:bg-[#f8fafc] focus-visible:outline-none"
                    >
                      <PackageOpen className="size-5 text-[#aab5c4]" />
                      Nothing declared in this box yet.
                      <span className="font-medium text-primary">Add the first item</span>
                    </button>
                  ) : (
                    <div className="px-4 pb-4 pt-3">
                      <div
                        aria-hidden
                        className={cn(ROW_GRID, 'hidden pb-2 text-xs font-medium text-muted-foreground md:grid')}
                      >
                        <span>Item</span>
                        <span>HSN code</span>
                        <span>Qty</span>
                        <span>Unit price{currency ? ` (${currency})` : ''}</span>
                        <span>Unit weight (g)</span>
                        <span className="sr-only">Priority</span>
                        <span className="sr-only">Remove</span>
                      </div>
                      <ol className="space-y-3 md:space-y-2">
                        {rows.map(({ f, index }) => (
                          <ItemRow
                            key={f.id}
                            index={index}
                            currency={currency}
                            onRemove={() => remove(index)}
                          />
                        ))}
                      </ol>
                      <p className="mt-3 flex flex-wrap justify-end gap-x-5 gap-y-1 border-t border-[#edf1f6] pt-3 text-xs tabular-nums text-muted-foreground">
                        <span>
                          {rows.length} {rows.length === 1 ? 'item' : 'items'}
                        </span>
                        <span>
                          Value <span className="font-semibold text-foreground">{money(boxValue, currency)}</span>
                        </span>
                        {boxGrams > 0 && (
                          <span>
                            Weight{' '}
                            <span className="font-semibold text-foreground">
                              {boxGrams >= 1000 ? formatWeight(boxGrams / 1000) : `${boxGrams} g`}
                            </span>
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ItemRow({
  index,
  currency,
  onRemove,
}: {
  index: number
  currency: string
  onRemove: () => void
}) {
  const { control } = useFormContext<Step2FormValues>()
  const name = useWatch({ control, name: `items.${index}.name` })
  const label = name?.trim() || `item ${index + 1}`

  return (
    <li className={cn(ROW_GRID, 'border-b border-[#edf1f6] pb-3 last:border-0 last:pb-0 md:border-0 md:pb-0')}>
      <FormField
        control={control}
        name={`items.${index}.name`}
        render={({ field }) => (
          <FormItem className="col-span-2 md:col-span-1">
            <FormLabel className="text-xs md:sr-only">Item</FormLabel>
            <FormControl>
              <Input className="h-10" placeholder="Cotton T-shirt" autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`items.${index}.hsnCode`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs md:sr-only">HSN code</FormLabel>
            <FormControl>
              <Input className="h-10 tabular-nums" placeholder="6109" autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`items.${index}.quantity`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs md:sr-only">Qty</FormLabel>
            <FormControl>
              <Input
                className="h-10 tabular-nums"
                inputMode="numeric"
                placeholder="1"
                {...field}
                onChange={(e) => field.onChange(clean(e.target.value, false))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`items.${index}.price`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs md:sr-only">Unit price{currency ? ` (${currency})` : ''}</FormLabel>
            <FormControl>
              <Input
                className="h-10 tabular-nums"
                inputMode="decimal"
                placeholder="0.00"
                {...field}
                onChange={(e) => field.onChange(clean(e.target.value, true))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`items.${index}.weight`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs md:sr-only">Unit weight (g)</FormLabel>
            <FormControl>
              <Input
                className="h-10 tabular-nums"
                inputMode="decimal"
                placeholder="Optional"
                {...field}
                onChange={(e) => field.onChange(clean(e.target.value, true))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="col-span-2 flex items-center justify-between gap-2 md:contents">
        <FormField
          control={control}
          name={`items.${index}.priority`}
          render={({ field }) => {
            const high = field.value === 'HIGH'
            return (
              <button
                type="button"
                aria-pressed={high}
                aria-label={`High priority for ${label}`}
                title={high ? 'High priority' : 'Mark as high priority'}
                onClick={() => field.onChange(high ? 'NORMAL' : 'HIGH')}
                className={cn(
                  'inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] px-3 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25 md:w-10 md:px-0',
                  high
                    ? 'bg-[#fffbeb] text-[#b45309] hover:bg-[#fef3c7]'
                    : 'text-[#aab5c4] hover:bg-[#f6f9fd] hover:text-[#526581]',
                )}
              >
                <Flag className={cn('size-4', high && 'fill-current')} />
                <span className="md:sr-only">{high ? 'High priority' : 'Normal priority'}</span>
              </button>
            )
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="size-10 text-[#aab5c4] hover:bg-[#fef2f2] hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  )
}
