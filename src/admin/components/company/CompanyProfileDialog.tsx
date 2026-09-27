import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useSaveCompanyProfile } from '@/admin/hooks'
import { applyFieldErrors } from '@/admin/forms'
import type { CompanyProfile } from '@/admin/types'
import { getApiErrorMessage } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

const schema = z.object({
  legalName: z.string().trim().min(1, 'Legal name is required'),
  gstNumber: z
    .string()
    .trim()
    .refine((v) => v === '' || GSTIN_RE.test(v), 'Enter a valid 15-character GST number'),
})
type Values = z.infer<typeof schema>

export function CompanyProfileDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: CompanyProfile | null
}) {
  const save = useSaveCompanyProfile()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { legalName: '', gstNumber: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({ legalName: profile?.legalName ?? '', gstNumber: profile?.gstNumber ?? '' })
    }
  }, [open, profile, form])

  const onSubmit = async (v: Values) => {
    try {
      // PUT replaces the profile: always send both; an empty GST clears it.
      await save.mutateAsync({ legalName: v.legalName, gstNumber: v.gstNumber || null })
      toast.success('Company profile saved.')
      onOpenChange(false)
    } catch (error) {
      applyFieldErrors(form, error, ['legalName', 'gstNumber'])
      toast.error(getApiErrorMessage(error, 'Could not save the company profile.'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{profile ? 'Edit company profile' : 'Set up company profile'}</DialogTitle>
          <DialogDescription>
            Customers see these details alongside your bank accounts.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="legalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Legal name</FormLabel>
                  <FormControl>
                    <Input placeholder="ASTHA INTERNATIONAL COURIER PVT. LTD." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gstNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="24AAACB1234C1ZV"
                      maxLength={15}
                      className="font-mono uppercase"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription className="text-[13px]">
                    Optional. Leave empty to remove it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Save profile
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
