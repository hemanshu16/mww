import { useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from '@/hooks/AuthContext'
import { clearStoredSession, getStoredSession, setStoredSession } from '@/lib/session'
import type { AuthSession, UserProfile } from '@/types/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(
    () => getStoredSession()?.profile ?? null,
  )

  const value = useMemo(
    () => ({
      profile,
      isAuthenticated: profile !== null,
      setSession: (session: AuthSession) => {
        setStoredSession(session)
        setProfile(session.profile)
      },
      logout: () => {
        clearStoredSession()
        setProfile(null)
      },
    }),
    [profile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
