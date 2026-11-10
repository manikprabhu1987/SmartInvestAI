import { apiClient } from './httpClient'
import type { AuthSession, LoginRequest, RegisterRequest, UserProfile } from './types'

export async function registerUser(request: RegisterRequest): Promise<UserProfile> {
  const response = await apiClient.post<UserProfile>('/auth/register', request)
  return response.data
}

export async function loginUser(request: LoginRequest): Promise<AuthSession> {
  const response = await apiClient.post<AuthSession>('/auth/login', request)
  return response.data
}

export async function logoutUser(accessToken: string): Promise<void> {
  await apiClient.post('/auth/logout', undefined, {
    requiresAuth: true,
    accessToken,
  })
}
