import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthContext, type AuthStatus } from '@/hooks/AuthContext'
import type { AuthSession, Profile } from '@/lib/types'
import { getMe } from '@/lib/api/users'
import { logout as logoutApi } from '@/lib/api/auth'
import {
  clearSession,
  getRefreshToken,
  getStoredProfile,
  hasSession,
  onSessionCleared,
  setProfile as persistProfile,
  setSession,
} from '@/lib/session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(() => getStoredProfile())
  const [status, setStatus] = useState<AuthStatus>(() =>
    hasSession() ? 'loading' : 'unauthenticated',
  )
  const hydrated = useRef(false)

  // Hydrate/verify the session on load via GET /users/me. If tokens are dead
  // the client's refresh-then-401 flow clears the session and we drop to anon.
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    if (!hasSession()) {
      setStatus('unauthenticated')
      return
    }
    getMe()
      .then((fresh) => {
        persistProfile(fresh)
        setProfileState(fresh)
        setStatus('authenticated')
      })
      .catch(() => {
        clearSession(false)
        setProfileState(null)
        setStatus('unauthenticated')
      })
  }, [])

  // React to out-of-band session clears (e.g. failed refresh in the client).
  useEffect(
    () =>
      onSessionCleared(() => {
        setProfileState(null)
        setStatus('unauthenticated')
      }),
    [],
  )

  const signIn = useCallback((session: AuthSession) => {
    setSession(session)
    setProfileState(session.profile)
    setStatus('authenticated')
  }, [])

  const signOut = useCallback(async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await logoutApi(refreshToken)
      } catch {
        /* revoke best-effort; clear locally regardless */
      }
    }
    clearSession(false)
    setProfileState(null)
    setStatus('unauthenticated')
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
