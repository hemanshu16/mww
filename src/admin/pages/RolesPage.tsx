import { useState } from 'react'
import { Eye, KeyRound, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { useDeleteRole, useRoles } from '@/admin/hooks'
import { RoleEditorDialog } from '@/admin/components/RoleEditorDialog'
import type { Role } from '@/admin/types'
import { getApiErrorMessage } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
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

const COLUMNS = 4

export default function RolesPage() {
  const { can, holdsAll } = useStaffAuth()
  const { data: roles = [], isLoading, isError, error } = useRoles()
  const remove = useDeleteRole()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [readOnly, setReadOnly] = useState(false)
  const [deleting, setDeleting] = useState<Role | null>(null)

  // You can only edit or delete a role whose permissions you all hold.
  const manageable = (r: Role) => holdsAll(r.permissions.map((p) => p.key))

  const openEditor = (role: Role | null, viewOnly = false) => {
    setEditing(role)
    setReadOnly(viewOnly)
    setEditorOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success(`${deleting.name} deleted.`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not delete the role.'))
    }
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Bundle permissions into roles, then assign roles to staff."
        actions={
          can('role.create') && (
            <Button onClick={() => openEditor(null)}>
              <Plus className="size-4" /> New role
            </Button>
          )
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Permissions</TableHead>
              <TableHead className="text-right">Staff</TableHead>
              <TableHead className="w-28">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: COLUMNS }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-[140px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={COLUMNS} className="py-12 text-center text-sm text-destructive">
                  {getApiErrorMessage(error, "Couldn't load roles. Please try again.")}
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={COLUMNS} className="p-0">
                  <EmptyState
                    icon={KeyRound}
                    title="No roles yet"
                    description="Create a role, pick its permissions, then assign it to staff."
                    action={
                      can('role.create') && (
                        <Button onClick={() => openEditor(null)}>
                          <Plus className="size-4" /> New role
                        </Button>
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              roles.map((r) => {
                const mine = manageable(r)
                const canEdit = can('role.update') && mine
                const canDelete = can('role.delete') && mine
                const groups = [...new Set(r.permissions.map((p) => p.group))]
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => openEditor(r, !canEdit)}
                        className="text-left text-sm font-medium text-foreground hover:underline"
                      >
                        {r.name}
                      </button>
                      {r.description && (
                        <p className="max-w-md truncate text-xs text-muted-foreground">
                          {r.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="tabular-nums">{r.permissions.length}</span>
                      {groups.length > 0 && (
                        <span className="hidden text-xs text-muted-foreground md:block">
                          {groups.join(', ')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.staffCount}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={canEdit ? `Edit ${r.name}` : `View ${r.name}`}
                          title={
                            canEdit
                              ? 'Edit'
                              : can('role.update')
                                ? 'You can only manage roles whose permissions you all have yourself'
                                : 'View'
                          }
                          onClick={() => openEditor(r, !canEdit)}
                        >
                          {canEdit ? <Pencil className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                        {canDelete && (
                          <span
                            title={
                              r.staffCount > 0 ? `Assigned to ${r.staffCount} staff` : 'Delete'
                            }
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete ${r.name}`}
                              disabled={r.staffCount > 0}
                              onClick={() => setDeleting(r)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <RoleEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        role={editing}
        readOnly={readOnly}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>
              This role will be removed. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Keep role</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete} loading={remove.isPending}>
              Delete role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
