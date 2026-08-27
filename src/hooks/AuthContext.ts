import { createContext } from 'react'
import type { AuthSession, UserProfile } from '@/types/auth'

export interface AuthContextValue {
  profile: UserProfile | null
  isAuthenticated: boolean
  setSession: (session: AuthSession) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
