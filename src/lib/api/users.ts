import { apiClient } from '@/lib/api/client'
import type { Profile } from '@/lib/types'

export function getMe() {
  return apiClient.get<Profile>('/users/me')
}

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  companyName?: string
  currentPassword?: string
  newPassword?: string
}

export function updateMe(input: UpdateProfileInput) {
  return apiClient.patch<Profile>('/users/me', input)
}
