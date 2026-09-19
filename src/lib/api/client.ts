import type { ApiEnvelope, TokenPair } from '@/lib/types'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/session'

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}`

/** Error carrying the API's human message plus the HTTP status. */
export class ApiRequestError extends Error {
  status: number
  /** Field-mapped validation errors parsed from a 400 `;`-joined string. */
  fieldErrors?: Record<string, string>
  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

/** Split a `"field: msg; field2: msg2"` validation string into a field map. */
export function parseFieldErrors(error: string): Record<string, string> | undefined {
  const parts = error.split('; ').map((s) => s.trim()).filter(Boolean)
  const map: Record<string, string> = {}
  for (const part of parts) {
    const idx = part.indexOf(': ')
    if (idx > 0) {
      const field = part.slice(0, idx).trim()
      const msg = part.slice(idx + 2).trim()
      if (field && !field.includes(' ')) map[field] = msg
    }
  }
  return Object.keys(map).length ? map : undefined
}

interface RequestOptions {
  method?: string
  body?: unknown
  /** Skip the Authorization header + refresh flow (auth endpoints). */
  auth?: boolean
  signal?: AbortSignal
}

// --- single-flight token refresh --------------------------------------------
let refreshPromise: Promise<TokenPair | null> | null = null

async function refreshTokens(): Promise<TokenPair | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    const json = (await res.json()) as ApiEnvelope<TokenPair>
    if (!res.ok || !json.success) return null
    setTokens(json.data)
    return json.data
  } catch {
    return null
  }
}

function ensureRefresh(): Promise<TokenPair | null> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function raw(path: string, opts: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {}
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.auth !== false && token) headers.Authorization = `Bearer ${token}`
  return fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  })
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const useAuth = opts.auth !== false
  let res = await raw(path, opts, getAccessToken())

  // On 401 for a protected route: refresh once, then retry the original call.
  if (res.status === 401 && useAuth) {
    const refreshed = await ensureRefresh()
    if (refreshed) {
      res = await raw(path, opts, refreshed.accessToken)
    } else {
      clearSession()
      throw new ApiRequestError('Your session has expired. Please sign in again.', 401)
    }
  }

  let json: ApiEnvelope<T>
  try {
    json = (await res.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiRequestError(`Request failed (${res.status})`, res.status)
  }

  if (!res.ok || !json.success) {
    const message = json.success === false ? json.error : `Request failed (${res.status})`
    const fieldErrors = res.status === 400 ? parseFieldErrors(message) : undefined
    throw new ApiRequestError(message, res.status, fieldErrors)
  }
  return json.data
}

export const apiClient = {
  get: <T>(path: string, opts?: RequestOptions) => apiRequest<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: 'PATCH', body }),
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}
