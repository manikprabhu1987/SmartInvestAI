import { afterEach, describe, expect, it } from 'vitest'
import {
  clearStoredSession,
  readStoredSession,
  saveStoredSession,
  SESSION_STORAGE_KEY,
} from './sessionStorage'
import type { AuthSession } from '../api/types'

const session: AuthSession = {
  accessToken: 'test-token',
  tokenType: 'Bearer',
  expiresAt: '2099-01-01T00:00:00Z',
  user: { id: 1, name: 'Taylor Investor', email: 'taylor@example.test' },
}

afterEach(() => clearStoredSession())

describe('session storage', () => {
  it('stores only the token session in session storage', () => {
    saveStoredSession(session)
    expect(readStoredSession()).toEqual(session)
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toContain('test-token')
    expect(localStorage.length).toBe(0)
  })

  it('clears expired or malformed sessions when read', () => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...session, expiresAt: '2000-01-01T00:00:00Z' }),
    )
    expect(readStoredSession()).toBeNull()
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()

    sessionStorage.setItem(SESSION_STORAGE_KEY, '{bad-json')
    expect(readStoredSession()).toBeNull()
  })

  it('clears the session explicitly', () => {
    saveStoredSession(session)
    clearStoredSession()
    expect(readStoredSession()).toBeNull()
  })
})
