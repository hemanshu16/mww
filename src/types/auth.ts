export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  companyName: string
  phoneNumber: string
  email: string
  isGstBilling: boolean
  isEmailVerified: boolean
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthSession extends AuthTokens {
  profile: UserProfile
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  companyName: string
  phoneNumber: string
  email: string
  password: string
  isGstBilling: boolean
}

export interface RegisterResponseData {
  email: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface VerifyEmailPayload {
  email: string
  code: string
}

export interface ResendOtpPayload {
  email: string
}

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}
