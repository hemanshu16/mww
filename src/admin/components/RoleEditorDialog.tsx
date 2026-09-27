import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Lock } from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { useCreateRole, usePermissionCatalog, useUpdateRole } from '@/admin/hooks'
import { applyFieldErrors } from '@/admin/forms'
import type { PermissionDef, Role, RoleInput } from '@/admin/types'
import { ApiRequestError, getApiErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a role name').max(100, 'At most 100 characters'),
  description: z.string().trim().max(500),
})
type Values = z.infer<typeof schema>

function sameSet(a: Set<string>, b: Set<string>) {
  return a.size === b.size && [...a].every((x) => b.has(x))
}

export function RoleEditorDialog({
  open,
  onOpenChange,
  role,
  readOnly,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Edit or view this role; null to create one. */
  role: Role | null
  readOnly?: boolean
}) {
  const { profile, can: holds } = useStaffAuth()
  const catalog = usePermissionCatalog(open)
  const create = useCreateRole()
  const update = useUpdateRole()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  })
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const initial = useMemo(() => new Set(role?.permissions.map((p) => p.id) ?? []), [role])

  useEffect(() => {
    if (!open) return
    form.reset({ name: role?.name ?? '', description: role?.description ?? '' })
    setSelected(new Set(initial))
  }, [open, role, initial, form])

  // Non-super admins can only grant permissions they hold themselves.
  const grantable = (p: PermissionDef) => !!profile?.isSuperAdmin || holds(p.key)

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const toggleGroup = (perms: PermissionDef[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      for (const p of perms) {
        if (!grantable(p)) continue
        if (on) next.add(p.id)
        else next.delete(p.id)
      }
      return next
    })

  const onSubmit = async (v: Values) => {
    const description = v.description || null
    try {
      if (role) {
        const input: Partial<RoleInput> = {}
        if (v.name !== role.name) input.name = v.name
        if (description !== (role.description ?? null)) input.description = description
        // PATCH replaces the whole list, so always send every checked box.
        if (!sameSet(selected, initial)) input.permissionIds = [...selected]
        if (Object.keys(input).length === 0) {
          onOpenChange(false)
          return
        }
        await update.mutateAsync({ id: role.id, input })
        toast.success(`${v.name} updated.`)
      } else {
        await create.mutateAsync({
          name: v.name,
          description: description ?? undefined,
          permissionIds: [...selected],
        })
        toast.success(`${v.name} created.`)
      }
      onOpenChange(false)
    } catch (error) {
      applyFieldErrors(form, error, ['name', 'description'])
      if (error instanceof ApiRequestError && error.status === 409) {
        form.setError('name', { message: error.message })
      }
      toast.error(getApiErrorMessage(error, 'Could not save the role.'))
    }
  }

  const title = readOnly ? role?.name : role ? `Edit ${role.name}` : 'New role'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="border-b border-border p-6 pb-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'You can view this role but not change it.'
              : 'Changes apply immediately to every staff member with this role.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
            noValidate
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required={!readOnly}>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Accounts" disabled={readOnly} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={1}
                          className="min-h-11"
                          placeholder="What this role is for"
                          disabled={readOnly}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-foreground">Permissions</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {selected.size} selected
                  </p>
                </div>

                {catalog.isLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="size-5 animate-spin text-primary" />
                  </div>
                ) : catalog.isError ? (
                  <p className="rounded-[10px] border border-border p-4 text-sm text-destructive">
                    {getApiErrorMessage(catalog.error, "Couldn't load permissions.")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {catalog.data?.map((group) => {
                      const allowed = group.permissions.filter(grantable)
                      const allOn = allowed.length > 0 && allowed.every((p) => selected.has(p.id))
                      return (
                        <fieldset key={group.group} className="rounded-[12px] border border-border">
                          <legend className="sr-only">{group.group}</legend>
                          <div className="flex items-center justify-between border-b border-border bg-[#f8fafc] px-4 py-2.5">
                            <span className="text-[13px] font-semibold text-foreground">
                              {group.group}
                            </span>
                            {!readOnly && allowed.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleGroup(group.permissions, !allOn)}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                {allOn ? 'Clear all' : 'Select all'}
                              </button>
                            )}
                          </div>
                          <ul className="divide-y divide-border">
                            {group.permissions.map((p) => {
                              const locked = !grantable(p)
                              const id = `perm-${p.id}`
                              return (
                                <li key={p.id}>
                                  <label
                                    htmlFor={id}
                                    className={cn(
                                      'flex items-start gap-3 px-4 py-3',
                                      readOnly || locked
                                        ? 'cursor-default'
                                        : 'cursor-pointer hover:bg-[#fbfcfe]',
                                    )}
                                    title={
                                      locked
                                        ? 'You can only grant permissions you have yourself'
                                        : undefined
                                    }
                                  >
                                    <Checkbox
                                      id={id}
                                      className="mt-0.5"
                                      checked={selected.has(p.id)}
                                      disabled={readOnly || locked}
                                      onCheckedChange={(on) => toggle(p.id, on === true)}
                                    />
                                    <span className="min-w-0 flex-1">
                                      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                        {p.name}
                                        {locked && !readOnly && (
                                          <Lock className="size-3.5 text-muted-foreground" />
                                        )}
                                      </span>
                                      <span className="block text-xs text-muted-foreground">
                                        {p.description}
                                      </span>
                                    </span>
                                    <code className="hidden shrink-0 text-[11px] text-[#8291a8] sm:block">
                                      {p.key}
                                    </code>
                                  </label>
                                </li>
                              )
                            })}
                          </ul>
                        </fieldset>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="border-t border-border p-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {readOnly ? 'Close' : 'Cancel'}
              </Button>
              {!readOnly && (
                <Button
                  type="submit"
                  loading={form.formState.isSubmitting}
                  disabled={catalog.isLoading}
                >
                  {role ? 'Save changes' : 'Create role'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
