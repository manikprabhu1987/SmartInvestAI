import type { AuthSession } from '../api/types'

export const SESSION_STORAGE_KEY = 'smartinvest.auth.session'

export function readStoredSession(): AuthSession | null {
  const rawSession = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!rawSession) return null

  try {
    const parsed: unknown = JSON.parse(rawSession)
    if (!isAuthSession(parsed) || Date.parse(parsed.expiresAt) <= Date.now()) {
      clearStoredSession()
      return null
    }
    return parsed
  } catch {
    clearStoredSession()
    return null
  }
}

export function saveStoredSession(session: AuthSession): void {
  if (!isAuthSession(session) || Date.parse(session.expiresAt) <= Date.now()) {
    throw new Error('The authentication response contains an invalid or expired session.')
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false
  const session = value as Partial<AuthSession>
  return Boolean(
    typeof session.accessToken === 'string' &&
      session.accessToken.length > 0 &&
      session.tokenType === 'Bearer' &&
      typeof session.expiresAt === 'string' &&
      Number.isFinite(Date.parse(session.expiresAt)) &&
      session.user &&
      typeof session.user.id === 'number' &&
      typeof session.user.name === 'string' &&
      typeof session.user.email === 'string',
  )
}
