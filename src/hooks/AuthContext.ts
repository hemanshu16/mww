import { createContext } from 'react'
import type { AuthSession, Profile } from '@/lib/types'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  status: AuthStatus
  profile: Profile | null
  /** Persist a fresh session (after login / verify) and mark authenticated. */
  signIn: (session: AuthSession) => void
  /** Revoke server-side, clear local session, and redirect to login. */
  signOut: () => Promise<void>
  /** Update the cached profile after a PATCH /users/me. */
  setProfile: (profile: Profile) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
