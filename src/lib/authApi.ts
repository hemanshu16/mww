import { api } from '@/lib/api'
import type {
  ApiEnvelope,
  AuthSession,
  LoginPayload,
  RegisterPayload,
  RegisterResponseData,
  ResendOtpPayload,
  VerifyEmailPayload,
} from '@/types/auth'

export async function registerClient(payload: RegisterPayload) {
  const { data } = await api.post<ApiEnvelope<RegisterResponseData>>('/auth/register', payload)
  return data
}

export async function verifyEmail(payload: VerifyEmailPayload) {
  const { data } = await api.post<ApiEnvelope<AuthSession>>('/auth/verify-email', payload)
  return data
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<ApiEnvelope<AuthSession>>('/auth/login', payload)
  return data
}

export async function resendOtp(payload: ResendOtpPayload) {
  const { data } = await api.post<ApiEnvelope<{ email: string }>>('/auth/resend-otp', payload)
  return data
}
