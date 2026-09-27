import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { StaffAuthContext, type StaffAuthValue } from '@/admin/staffAuthContext'
import { getStaffMe, staffLogout } from '@/admin/api'
import type { StaffAuth } from '@/admin/types'
import { onForbidden } from '@/lib/api/client'
import {
  clearSession,
  getStaffSession,
  onSessionChange,
  setStaffAccess,
  setStaffSession,
} from '@/lib/session'

const FOCUS_REFRESH_MS = 60 * 1000

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const [session, setSessionState] = useState(() => getStaffSession())
  const lastFetch = useRef(0)
  const inFlight = useRef<Promise<void> | null>(null)

  // Mirror the stored session: refreshes rotate permissions, a failed refresh
  // or a customer login elsewhere clears it.
  useEffect(() => onSessionChange(() => setSessionState(getStaffSession())), [])

  const refreshAccess = useCallback(() => {
    if (!getStaffSession()) return Promise.resolve()
    if (!inFlight.current) {
      lastFetch.current = Date.now()
      inFlight.current = getStaffMe()
        .then((me) => setStaffAccess(me.profile, me.permissions))
        .catch(() => {
          /* 401s are handled by the client (refresh, then clear); keep the rest */
        })
        .finally(() => {
          inFlight.current = null
        })
    }
    return inFlight.current
  }, [])

  const staffId = session?.profile.id

  // Permissions can change while signed in: refetch on load, on tab focus
  // (throttled) and after any 403.
  useEffect(() => {
    if (!staffId) return
    refreshAccess()
    const onVisible = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastFetch.current > FOCUS_REFRESH_MS
      ) {
        refreshAccess()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    const offForbidden = onForbidden(() => {
      refreshAccess()
    })
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      offForbidden()
    }
  }, [staffId, refreshAccess])

  const signIn = useCallback(
    (auth: StaffAuth) => {
      qc.clear() // never show data cached for another account
      setStaffSession(auth)
      lastFetch.current = Date.now()
    },
    [qc],
  )

  const signOut = useCallback(async () => {
    const current = getStaffSession()
    if (current) {
      try {
        await staffLogout(current.refreshToken)
      } catch {
        /* best-effort; clear locally regardless */
      }
    }
    clearSession()
    qc.clear()
  }, [qc])

  const value = useMemo<StaffAuthValue>(() => {
    const permissions = session?.permissions ?? []
    const held = new Set(permissions)
    return {
      status: session ? 'authenticated' : 'unauthenticated',
      profile: session?.profile ?? null,
      permissions,
      can: (key) => held.has(key),
      holdsAll: (keys) =>
        !!session && (session.profile.isSuperAdmin || keys.every((k) => held.has(k))),
      signIn,
      signOut,
      refreshAccess,
    }
  }, [session, signIn, signOut, refreshAccess])

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>
}
