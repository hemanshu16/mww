import type { Staff, StaffDetail, StaffProfile } from '@/admin/types'

/**
 * Why the current user can't manage `target`, or null when they can.
 * Mirrors the backend's rules so the UI doesn't offer actions that will 403.
 */
export function manageBlockReason(
  me: StaffProfile | null,
  myPermissions: string[],
  target: Staff | StaffDetail,
): string | null {
  if (!me) return 'Not signed in'
  if (me.isSuperAdmin) return null
  if (target.isSuperAdmin) return 'Only a super admin can manage a super admin'
  if ('permissions' in target) {
    const mine = new Set(myPermissions)
    if (!target.permissions.every((p) => mine.has(p))) {
      return 'You can only manage staff whose permissions you all have yourself'
    }
  }
  return null
}
