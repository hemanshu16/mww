import { createContext, useContext } from 'react'
import type { StaffAuth, StaffProfile } from '@/admin/types'

export type StaffAuthStatus = 'authenticated' | 'unauthenticated'

export interface StaffAuthValue {
  status: StaffAuthStatus
  profile: StaffProfile | null
  permissions: string[]
  /** True when the signed-in staff member holds `key`. */
  can: (key: string) => boolean
  /** True when every key is held (super admins hold them all). */
  holdsAll: (keys: string[]) => boolean
  signIn: (auth: StaffAuth) => void
  signOut: () => Promise<void>
  /** Refetch profile + permissions from /admin/auth/me. */
  refreshAccess: () => Promise<void>
}

export const StaffAuthContext = createContext<StaffAuthValue | null>(null)

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext)
  if (!ctx) throw new Error('useStaffAuth must be used within <StaffAuthProvider>')
  return ctx
}
