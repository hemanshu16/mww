import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreateCourierProvider, useUpdateCourierProvider } from '@/admin/hooks'
import { applyFieldErrors } from '@/admin/forms'
import type { AdminCourierProvider, CourierProviderInput } from '@/admin/types'
import { getApiErrorMessage } from '@/lib/api/client'
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

const schema = z.object({
  name: z.string().trim().min(1, 'Enter the provider name').max(100),
  logoUrl: z
    .string()
    .trim()
    .refine((v) => z.url().safeParse(v).success, 'Enter a full URL starting with https://'),
  isGstApplicable: z.boolean(),
})
type Values = z.infer<typeof schema>

const FIELDS = ['name', 'logoUrl', 'isGstApplicable'] as const

function toValues(p: AdminCourierProvider | null): Values {
  return {
    name: p?.name ?? '',
    logoUrl: p?.logoUrl ?? '',
    isGstApplicable: p?.isGstApplicable ?? true,
  }
}

function toInput(v: Values): CourierProviderInput {
  return {
    name: v.name.trim(),
    logoUrl: v.logoUrl.trim(),
    isGstApplicable: v.isGstApplicable,
  }
}

export function CourierProviderDialog({
  open,
  onOpenChange,
  provider,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Edit this provider; null to add a new one. */
  provider: AdminCourierProvider | null
}) {
  const create = useCreateCourierProvider()
  const update = useUpdateCourierProvider()
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(provider) })
  const isEdit = !!provider

  useEffect(() => {
    if (open) form.reset(toValues(provider))
  }, [open, provider, form])

  const onSubmit = async (v: Values) => {
    const input = toInput(v)
    try {
      if (provider) {
        // PATCH only what changed; the API rejects an empty body.
        const before = toInput(toValues(provider))
        const diff: Partial<CourierProviderInput> = {}
        for (const key of Object.keys(input) as (keyof CourierProviderInput)[]) {
          if (input[key] !== before[key]) (diff as Record<string, unknown>)[key] = input[key]
        }
        if (Object.keys(diff).length === 0) {
          onOpenChange(false)
          return
        }
        await update.mutateAsync({ id: provider.id, input: diff })
        toast.success(`${input.name} updated.`)
      } else {
        await create.mutateAsync(input)
        toast.success(`${input.name} added.`)
      }
      onOpenChange(false)
    } catch (error) {
      applyFieldErrors(form, error, FIELDS)
      toast.error(
        getApiErrorMessage(error, isEdit ? 'Could not save changes.' : 'Could not add provider.'),
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${provider.name}` : 'Add courier provider'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Changes apply to new bookings.'
              : 'New providers are active and shown to customers straight away.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="DHL Express" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Logo URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isGstApplicable"
              render={({ field }) => (
                <FormItem className="flex items-start justify-between gap-6 space-y-0 rounded-[10px] border border-border p-4">
                  <div className="space-y-1">
                    <FormLabel>GST applicable</FormLabel>
                    <FormDescription className="text-[13px]">
                      Add GST to this provider&apos;s charges.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                {isEdit ? 'Save changes' : 'Add provider'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
