import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { useStaffDetail, useUpdateStaff } from '@/admin/hooks'
import { applyFieldErrors } from '@/admin/forms'
import { RolePicker } from '@/admin/components/staff/RolePicker'
import { manageBlockReason } from '@/admin/components/staff/staffAccess'
import type { Staff, UpdateStaffInput } from '@/admin/types'
import { getApiErrorMessage } from '@/lib/api/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  name: z.string().trim().min(1, 'Enter a name').max(100),
  roleIds: z.array(z.string()),
  isActive: z.boolean(),
})
type Values = z.infer<typeof schema>

function sameIds(a: string[], b: string[]) {
  return a.length === b.length && a.every((x) => b.includes(x))
}

export function EditStaffDialog({
  staff,
  onOpenChange,
}: {
  /** The row being edited; null when closed. */
  staff: Staff | null
  onOpenChange: (open: boolean) => void
}) {
  const { profile: me, permissions } = useStaffAuth()
  const detail = useStaffDetail(staff?.id ?? null)
  const update = useUpdateStaff()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', roleIds: [], isActive: true },
  })
  const isActive = useWatch({ control: form.control, name: 'isActive' })

  const target = detail.data
  const isSelf = !!staff && staff.id === me?.id
  const blocked = target ? manageBlockReason(me, permissions, target) : null

  useEffect(() => {
    if (target) {
      form.reset({
        name: target.name,
        roleIds: target.roles.map((r) => r.id),
        isActive: target.isActive,
      })
    }
  }, [target, form])

  const onSubmit = async (v: Values) => {
    if (!target) return
    const input: UpdateStaffInput = {}
    if (v.name !== target.name) input.name = v.name
    // You can't change your own roles or active status; roleIds replaces the list.
    if (!isSelf) {
      const before = target.roles.map((r) => r.id)
      if (!sameIds(v.roleIds, before)) input.roleIds = v.roleIds
      if (v.isActive !== target.isActive) input.isActive = v.isActive
    }
    if (Object.keys(input).length === 0) {
      onOpenChange(false)
      return
    }
    try {
      await update.mutateAsync({ id: target.id, input })
      toast.success(
        input.isActive === false
          ? `${v.name} deactivated and signed out everywhere.`
          : `${v.name} updated.`,
      )
      onOpenChange(false)
    } catch (error) {
      applyFieldErrors(form, error, ['name', 'roleIds', 'isActive'])
      toast.error(getApiErrorMessage(error, 'Could not save changes.'))
    }
  }

  return (
    <Dialog open={!!staff} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isSelf ? 'Edit your details' : `Edit ${staff?.name ?? 'staff'}`}
          </DialogTitle>
          <DialogDescription>{staff?.email}</DialogDescription>
        </DialogHeader>

        {detail.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : detail.isError || !target ? (
          <p className="py-6 text-center text-sm text-destructive">
            {getApiErrorMessage(detail.error, "Couldn't load this staff member.")}
          </p>
        ) : blocked ? (
          <>
            <Alert variant="warning">
              <ShieldAlert />
              <AlertDescription>{blocked}.</AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isSelf ? (
                <p className="rounded-[10px] bg-[#f8fafc] p-3 text-[13px] text-muted-foreground">
                  You can&apos;t change your own roles or active status. Ask another administrator.
                </p>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="roleIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roles</FormLabel>
                        <FormDescription className="text-[13px]">
                          {target.isSuperAdmin
                            ? 'Super admins hold every permission regardless of roles.'
                            : 'Role changes take effect immediately.'}
                        </FormDescription>
                        <RolePicker value={field.value} onChange={field.onChange} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-start justify-between gap-6 space-y-0 rounded-[10px] border border-border p-4">
                        <div className="space-y-1">
                          <FormLabel>Active</FormLabel>
                          <FormDescription className="text-[13px]">
                            {isActive
                              ? 'Can sign in to the staff console.'
                              : target.isActive
                                ? 'Saving signs them out everywhere immediately.'
                                : 'Blocked from signing in.'}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={!isSelf && !isActive && target.isActive ? 'destructive' : 'default'}
                  loading={form.formState.isSubmitting}
                >
                  {!isSelf && !isActive && target.isActive ? 'Deactivate & save' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
