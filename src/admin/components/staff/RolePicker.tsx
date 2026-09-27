import { Loader2, Lock } from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { useRoles } from '@/admin/hooks'
import type { Role } from '@/admin/types'
import { getApiErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

/**
 * Multi-select of roles. Roles holding permissions you don't have can't be
 * assigned (unless you're a super admin), but stay visible and keep their state.
 */
export function RolePicker({
  value,
  onChange,
  disabled,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}) {
  const { can, holdsAll } = useStaffAuth()
  const canList = can('role.read')
  const roles = useRoles(canList)

  if (!canList) {
    return (
      <p className="rounded-[10px] border border-dashed border-border p-3 text-[13px] text-muted-foreground">
        You need permission to view roles before you can assign them.
      </p>
    )
  }
  if (roles.isLoading) {
    return (
      <div className="flex justify-center rounded-[10px] border border-border py-6">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    )
  }
  if (roles.isError) {
    return (
      <p className="rounded-[10px] border border-border p-3 text-sm text-destructive">
        {getApiErrorMessage(roles.error, "Couldn't load roles.")}
      </p>
    )
  }
  if (!roles.data?.length) {
    return (
      <p className="rounded-[10px] border border-dashed border-border p-3 text-[13px] text-muted-foreground">
        No roles yet. Create one on the Roles page first.
      </p>
    )
  }

  const assignable = (r: Role) => holdsAll(r.permissions.map((p) => p.key))
  const selected = new Set(value)

  return (
    <ul className="max-h-60 divide-y divide-border overflow-y-auto rounded-[10px] border border-border">
      {roles.data.map((r) => {
        const locked = !assignable(r)
        const off = disabled || locked
        const id = `role-${r.id}`
        return (
          <li key={r.id}>
            <label
              htmlFor={id}
              className={cn(
                'flex items-start gap-3 px-3 py-2.5',
                off ? 'cursor-default' : 'cursor-pointer hover:bg-[#fbfcfe]',
              )}
              title={
                locked
                  ? 'You can only assign roles whose permissions you all have yourself'
                  : undefined
              }
            >
              <Checkbox
                id={id}
                className="mt-0.5"
                checked={selected.has(r.id)}
                disabled={off}
                onCheckedChange={(on) =>
                  onChange(on === true ? [...value, r.id] : value.filter((x) => x !== r.id))
                }
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {r.name}
                  {locked && <Lock className="size-3.5 text-muted-foreground" />}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {r.permissions.length} permission{r.permissions.length === 1 ? '' : 's'}
                  {r.description ? ` · ${r.description}` : ''}
                </span>
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
