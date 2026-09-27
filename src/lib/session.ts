import type { AuthSession, Profile, TokenPair } from '@/lib/types'
import type { StaffAuth, StaffProfile } from '@/admin/types'

// One session at a time, persisted under a single key. `kind` is recorded at
// login and decides which refresh endpoint and which area of the app apply.
// Customers and staff never hold a session together.

export type SessionKind = 'customer' | 'staff'

export interface CustomerSession {
  kind: 'customer'
  accessToken: string
  refreshToken: string
  profile: Profile
}

export interface StaffSession {
  kind: 'staff'
  accessToken: string
  refreshToken: string
  profile: StaffProfile
  permissions: string[]
}

export type Session = CustomerSession | StaffSession

const SESSION_KEY = 'mww.session'
// Pre-`kind` keys; migrated to a customer session on first read.
const LEGACY_KEYS = ['mww.accessToken', 'mww.refreshToken', 'mww.profile'] as const

/** Fallback when localStorage is unavailable: the session lives for this tab only. */
let memory: Session | null = null

// Listeners (the auth providers) re-read the session on every change, including
// out-of-band ones like a failed refresh inside the API client or another tab.
type Listener = () => void
const listeners = new Set<Listener>()
export function onSessionChange(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
const emit = () => listeners.forEach((fn) => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === SESSION_KEY || e.key === null) emit()
  })
}

function migrateLegacy(): Session | null {
  const [access, refresh, profile] = LEGACY_KEYS.map((k) => localStorage.getItem(k))
  if (!access && !refresh) return null
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
  if (!access || !refresh || !profile) return null
  const session: CustomerSession = {
    kind: 'customer',
    accessToken: access,
    refreshToken: refresh,
    profile: JSON.parse(profile) as Profile,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw) as Session
    return migrateLegacy()
  } catch {
    return memory
  }
}

function write(session: Session | null) {
  memory = session
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* storage unavailable — keep the in-memory copy */
  }
  emit()
}

export function getSessionKind(): SessionKind | null {
  return getSession()?.kind ?? null
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null
}

export function getRefreshToken(): string | null {
  return getSession()?.refreshToken ?? null
}

// --- customer ---------------------------------------------------------------

/** The customer profile, or null when there's no customer session. */
export function getStoredProfile(): Profile | null {
  const s = getSession()
  return s?.kind === 'customer' ? s.profile : null
}

/** Replaces any existing session (including a staff one). */
export function setSession(session: AuthSession) {
  write({ kind: 'customer', ...session })
}

export function setProfile(profile: Profile) {
  const s = getSession()
  if (s?.kind === 'customer') write({ ...s, profile })
}

/** Store a rotated token pair on whichever session is active. */
export function setTokens(tokens: TokenPair) {
  const s = getSession()
  if (s) write({ ...s, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
}

// --- staff ------------------------------------------------------------------

export function getStaffSession(): StaffSession | null {
  const s = getSession()
  return s?.kind === 'staff' ? s : null
}

/** Login or refresh: replaces any existing session (including a customer one). */
export function setStaffSession(auth: StaffAuth) {
  write({ kind: 'staff', ...auth })
}

/** Fresh profile + permissions from /admin/auth/me. */
export function setStaffAccess(profile: StaffProfile, permissions: string[]) {
  const s = getStaffSession()
  if (s) write({ ...s, profile, permissions })
}

// ----------------------------------------------------------------------------

export function clearSession() {
  write(null)
}

export function hasSession(kind?: SessionKind): boolean {
  const s = getSession()
  return !!s && (!kind || s.kind === kind)
}
