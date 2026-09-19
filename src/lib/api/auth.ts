import { apiClient } from '@/lib/api/client'
import type { AuthSession, TokenPair } from '@/lib/types'

export interface RegisterInput {
  firstName: string
  lastName: string
  companyName: string
  phoneNumber: string
  email: string
  password: string
  isGstBilling: boolean
}

export function register(input: RegisterInput) {
  return apiClient.post<{ email: string }>('/auth/register', input, { auth: false })
}

export function verifyEmail(email: string, code: string) {
  return apiClient.post<AuthSession>('/auth/verify-email', { email, code }, { auth: false })
}

export function resendOtp(email: string) {
  return apiClient.post<Record<string, never>>('/auth/resend-otp', { email }, { auth: false })
}

export function login(email: string, password: string) {
  return apiClient.post<AuthSession>('/auth/login', { email, password }, { auth: false })
}

export function refresh(refreshToken: string) {
  return apiClient.post<TokenPair>('/auth/refresh', { refreshToken }, { auth: false })
}

export function logout(refreshToken: string) {
  return apiClient.post<Record<string, never>>('/auth/logout', { refreshToken }, { auth: false })
}
