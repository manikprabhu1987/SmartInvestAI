import axios, {
  type AxiosAdapter,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { ApiError, ApiProblem } from './types'
import { getApiBaseUrl } from './apiConfig'
import { readStoredSession } from '../auth/sessionStorage'

type AuthenticatedRequestConfig = InternalAxiosRequestConfig & {
  requiresAuth?: boolean
  accessToken?: string
}

interface ApiClientOptions {
  baseURL: string
  getAccessToken: () => string | null
  onUnauthorized: () => void
  adapter?: AxiosAdapter
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    requiresAuth?: boolean
    accessToken?: string
  }
}

export function createApiClient({
  baseURL,
  getAccessToken,
  onUnauthorized,
  adapter,
}: ApiClientOptions): AxiosInstance {
  const client = axios.create({ baseURL, adapter })
  const apiOrigin = new URL(baseURL, window.location.origin).origin

  client.interceptors.request.use((config) => {
    const request = config as AuthenticatedRequestConfig
    const requestBase = new URL(config.baseURL ?? baseURL, window.location.origin)
    const requestUrl = new URL(config.url ?? '', requestBase)
    if (request.requiresAuth && requestUrl.origin === apiOrigin) {
      const token = request.accessToken ?? getAccessToken()
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`)
      }
    } else {
      config.headers.delete('Authorization')
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        (error.config as AuthenticatedRequestConfig | undefined)?.requiresAuth
      ) {
        onUnauthorized()
      }
      return Promise.reject(error)
    },
  )

  return client
}

export function getApiError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { status?: unknown; data?: unknown } }).response
    const status = typeof response?.status === 'number' ? response.status : undefined
    const problem =
      response?.data && typeof response.data === 'object'
        ? (response.data as ApiProblem)
        : undefined
    return {
      message: problem?.detail || fallbackMessage(status),
      code: problem?.code,
      status,
    }
  }

  if (axios.isAxiosError(error)) {
    return { message: fallbackMessage(error.response?.status), status: error.response?.status }
  }

  return {
    message: 'The request could not be completed. Check your connection and try again.',
  }
}

function fallbackMessage(status?: number): string {
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'You do not have permission to complete this request.'
  if (status === 404) return 'The requested item could not be found.'
  if (status === 409) return 'This item already exists.'
  if (status && status >= 500) return 'The service is temporarily unavailable. Please try again.'
  return 'The request could not be completed. Check your connection and try again.'
}

export const apiClient = createApiClient({
  baseURL: getApiBaseUrl(),
  getAccessToken: () => readStoredSession()?.accessToken ?? null,
  onUnauthorized: () => window.dispatchEvent(new Event('smartinvest:unauthorized')),
})
