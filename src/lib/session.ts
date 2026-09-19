import type { AuthSession, Profile, TokenPair } from '@/lib/types'

// MVP session persistence in localStorage. Centralised so the API client,
// AuthProvider, and refresh interceptor all read/write the same source.

const ACCESS_KEY = 'mww.accessToken'
const REFRESH_KEY = 'mww.refreshToken'
const PROFILE_KEY = 'mww.profile'

// Notify listeners (AuthProvider) when the session is cleared out-of-band,
// e.g. when a token refresh fails inside the API client.
type Listener = () => void
const listeners = new Set<Listener>()
export function onSessionCleared(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY)
  } catch {
    return null
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function getStoredProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? (JSON.parse(raw) as Profile) : null
  } catch {
    return null
  }
}

export function setTokens(tokens: TokenPair) {
  try {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  } catch {
    /* storage unavailable — session lives in memory for this tab only */
  }
}

export function setProfile(profile: Profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {
    /* ignore */
  }
}

export function setSession(session: AuthSession) {
  setTokens(session)
  setProfile(session.profile)
}

export function clearSession(notify = true) {
  try {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(PROFILE_KEY)
  } catch {
    /* ignore */
  }
  if (notify) listeners.forEach((fn) => fn())
}

export function hasSession(): boolean {
  return !!getAccessToken() && !!getRefreshToken()
}
