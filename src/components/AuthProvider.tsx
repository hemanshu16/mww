import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthContext, type AuthStatus } from '@/hooks/AuthContext'
import type { AuthSession, Profile } from '@/lib/types'
import { getMe } from '@/lib/api/users'
import { logout as logoutApi } from '@/lib/api/auth'
import { queryClient } from '@/lib/queryClient'
import {
  clearSession,
  getRefreshToken,
  getStoredProfile,
  hasSession,
  onSessionChange,
  setProfile as persistProfile,
  setSession,
} from '@/lib/session'

/** Customer auth. A staff session counts as signed out here. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(() => getStoredProfile())
  const [status, setStatus] = useState<AuthStatus>(() =>
    hasSession('customer') ? 'loading' : 'unauthenticated',
  )
  const hydrated = useRef(false)

  // Hydrate/verify the session on load via GET /users/me. If tokens are dead
  // the client's refresh-then-401 flow clears the session and we drop to anon.
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    if (!hasSession('customer')) return
    getMe()
      .then((fresh) => {
        persistProfile(fresh)
        setProfileState(fresh)
        setStatus('authenticated')
      })
      .catch(() => {
        // Never clear a session of the other kind that replaced ours meanwhile.
        if (hasSession('customer')) clearSession()
        setProfileState(null)
        setStatus('unauthenticated')
      })
  }, [])

  // Follow out-of-band changes: failed refresh, staff login, other tabs.
  useEffect(
    () =>
      onSessionChange(() => {
        const stored = getStoredProfile()
        setProfileState(stored)
        setStatus((prev) =>
          stored ? (prev === 'loading' ? prev : 'authenticated') : 'unauthenticated',
        )
      }),
    [],
  )

  const signIn = useCallback((session: AuthSession) => {
    queryClient.clear() // never show data cached for another account
    setSession(session)
    setProfileState(session.profile)
    setStatus('authenticated')
  }, [])

  const signOut = useCallback(async () => {
    if (!hasSession('customer')) return
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await logoutApi(refreshToken)
      } catch {
        /* revoke best-effort; clear locally regardless */
      }
    }
    clearSession()
    queryClient.clear()
  }, [])

  const setProfile = useCallback((next: Profile) => {
    persistProfile(next)
    setProfileState(next)
  }, [])

  return (
    <AuthContext.Provider value={{ status, profile, signIn, signOut, setProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
