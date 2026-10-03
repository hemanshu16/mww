import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AlertCircle, AlertTriangle, Info, Pencil, Plus, Scale, Trash2 } from 'lucide-react'
import { useCreateMarginSlab, useDeleteMarginSlab, useUpdateMarginSlab } from '@/admin/hooks'
import { applyFieldErrors } from '@/admin/forms'
import type { MarginSlab, MarginSlabInput } from '@/admin/types'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { formatINR } from '@/lib/format'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const slabLabel = (s: Pick<MarginSlab, 'minKg' | 'maxKg'>) =>
  s.maxKg === null ? `${s.minKg} kg and above` : `${s.minKg}–${s.maxKg} kg`

const rangeLabel = (from: number, to: number) => (from === to ? `${from} kg` : `${from}–${to} kg`)

/** Weight ranges no slab covers (the API allows gaps; we just warn). */
function findGaps(slabs: MarginSlab[]): string[] {
  const sorted = [...slabs].sort((a, b) => a.minKg - b.minKg)
  const gaps: string[] = []
  let next = 1
  for (const s of sorted) {
    if (s.minKg > next) gaps.push(rangeLabel(next, s.minKg - 1))
    if (s.maxKg === null) return gaps
    next = Math.max(next, s.maxKg + 1)
  }
  return gaps
}

const wholeKg = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}`)
    .refine((v) => /^\d+$/.test(v), 'Whole kg only')
    .refine((v) => Number(v) >= 1, 'At least 1 kg')

const schema = z
  .object({
    minKg: wholeKg('the starting weight'),
    openEnded: z.boolean(),
    maxKg: z.string().trim(),
    margin: z
      .string()
      .trim()
      .min(1, 'Enter the margin')
      .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), '0 or more, up to 2 decimals'),
  })
  .superRefine((v, ctx) => {
    if (v.openEnded) return
    const issue = (message: string) => ctx.addIssue({ code: 'custom', path: ['maxKg'], message })
    if (!v.maxKg) return issue('Enter the end weight, or tick "and above"')
    if (!/^\d+$/.test(v.maxKg)) return issue('Whole kg only')
    if (/^\d+$/.test(v.minKg) && Number(v.maxKg) < Number(v.minKg)) {
      issue('Must be at least the From weight')
    }
  })
type Values = z.infer<typeof schema>

const toValues = (s: MarginSlab | null, suggestedMin: number | null): Values => ({
  minKg: s ? String(s.minKg) : suggestedMin ? String(suggestedMin) : '',
  openEnded: s ? s.maxKg === null : false,
  maxKg: s?.maxKg != null ? String(s.maxKg) : '',
  margin: s ? String(s.margin) : '',
})

const toInput = (v: Values): MarginSlabInput => ({
  minKg: Number(v.minKg),
  maxKg: v.openEnded ? null : Number(v.maxKg),
  margin: Number(v.margin),
})

/** Margin slabs on a courier provider's page. Writes need `courier_provider.update`. */
export function MarginSlabsCard({
  providerId,
  slabs,
  canEdit,
}: {
  providerId: string
  /** Lightest first, as the API returns them. */
  slabs: MarginSlab[]
  canEdit: boolean
}) {
  const [editing, setEditing] = useState<MarginSlab | 'new' | null>(null)
  const [deleting, setDeleting] = useState<MarginSlab | null>(null)
  const remove = useDeleteMarginSlab(providerId)

  const gaps = findGaps(slabs)
  const last = slabs.at(-1)
  const hasOpenEnded = slabs.some((s) => s.maxKg === null)
  // Pre-fill "From" so ranges run edge to edge (1–5, then 6…).
  const suggestedMin = !last ? 1 : last.maxKg === null ? null : last.maxKg + 1

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success(`${slabLabel(deleting)} margin slab deleted.`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not delete the slab.'))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Margin slabs</CardTitle>
          <CardDescription>
            Our flat margin on top of this provider&apos;s price, by shipment weight. Weight is
            rounded up to a whole kg (5.4 kg counts as 6 kg).
          </CardDescription>
        </div>
        {canEdit && (
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-4" /> Add slab
          </Button>
        )}
      </CardHeader>

      {slabs.length > 0 && (gaps.length > 0 || !hasOpenEnded) && (
        <div className="space-y-2 px-6 pb-4">
          {gaps.length > 0 && (
            <Alert variant="warning">
              <AlertTriangle />
              <AlertDescription>
                {gaps.length === 1 ? 'Weights ' : 'These weights '}
                {gaps.join(', ')} have no margin.
              </AlertDescription>
            </Alert>
          )}
          {!hasOpenEnded && (
            <Alert variant="info">
              <Info />
              <AlertDescription>
                Add a final &ldquo;and above&rdquo; slab so heavy shipments always have a margin.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <CardContent className="border-t border-border p-0">
        {slabs.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="No margin slabs yet"
            description={
              canEdit
                ? 'Start with 1 kg and add ranges that run edge to edge, ending with an "and above" slab.'
                : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Weight</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                {canEdit && <TableHead className="w-24 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {slabs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium tabular-nums">{slabLabel(s)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(s.margin)}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Edit ${slabLabel(s)} slab`}
                          onClick={() => setEditing(s)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Delete ${slabLabel(s)} slab`}
                          onClick={() => setDeleting(s)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {editing && (
        <SlabDialog
          providerId={providerId}
          slab={editing === 'new' ? null : editing}
          suggestedMin={suggestedMin}
          onClose={() => setEditing(null)}
        />
      )}

      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete the {deleting ? slabLabel(deleting) : ''} margin slab?</DialogTitle>
            <DialogDescription>
              Shipments in this weight range will have no margin until another slab covers it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Keep it</Button>
            </DialogClose>
            <Button variant="destructive" loading={remove.isPending} onClick={confirmDelete}>
              Delete slab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function SlabDialog({
  providerId,
  slab,
  suggestedMin,
  onClose,
}: {
  providerId: string
  /** null to add a new slab. */
  slab: MarginSlab | null
  suggestedMin: number | null
  onClose: () => void
}) {
  const create = useCreateMarginSlab(providerId)
  const update = useUpdateMarginSlab(providerId)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(slab, suggestedMin),
  })
  const openEnded = useWatch({ control: form.control, name: 'openEnded' })
  // Overlaps (409) and other errors that aren't about one field.
  const [banner, setBanner] = useState<string | null>(null)

  // Ticking "and above" clears and disables To.
  useEffect(() => {
    if (openEnded) {
      form.setValue('maxKg', '')
      form.clearErrors('maxKg')
    }
  }, [openEnded, form])

  const onSubmit = async (v: Values) => {
    setBanner(null)
    const input = toInput(v)
    try {
      if (slab) {
        // PATCH only what changed.
        const diff: Partial<MarginSlabInput> = {}
        if (input.minKg !== slab.minKg) diff.minKg = input.minKg
        if (input.maxKg !== slab.maxKg) diff.maxKg = input.maxKg
        if (input.margin !== slab.margin) diff.margin = input.margin
        if (Object.keys(diff).length === 0) return onClose()
        await update.mutateAsync({ slabId: slab.id, input: diff })
        toast.success(`${slabLabel(input)} margin slab updated.`)
      } else {
        await create.mutateAsync(input)
        toast.success(`${slabLabel(input)} margin slab added.`)
      }
      onClose()
    } catch (err) {
      if (applyFieldErrors(form, err, ['minKg', 'maxKg', 'margin'])) return
      if (err instanceof ApiRequestError && err.status === 404) {
        // The provider or slab is gone; the list refreshes on its own.
        toast.error(err.message)
        return onClose()
      }
      setBanner(getApiErrorMessage(err, 'Could not save the slab.'))
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{slab ? `Edit ${slabLabel(slab)} slab` : 'Add margin slab'}</DialogTitle>
          <DialogDescription>Whole kg; both ends of the range are included.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {banner && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{banner}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>From (kg)</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="1" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required={!openEnded}>To (kg)</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder={openEnded ? 'No limit' : '5'}
                        autoComplete="off"
                        disabled={openEnded}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="openEnded"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2.5 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(c) => field.onChange(c === true)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    And above (no upper limit, for the heaviest shipments)
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="margin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Margin (₹)</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" placeholder="150.00" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                {slab ? 'Save changes' : 'Add slab'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
