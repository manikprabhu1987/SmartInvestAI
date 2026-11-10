import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { loginUser, logoutUser, registerUser } from '../api/authApi'
import type { AuthSession, LoginRequest, RegisterRequest, UserProfile } from '../api/types'
import {
  clearStoredSession,
  readStoredSession,
  saveStoredSession,
} from './sessionStorage'

interface AuthContextValue {
  session: AuthSession | null
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<UserProfile>
  logout: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession())

  const expireSession = useCallback(() => {
    clearStoredSession()
    setSession(null)
  }, [])

  useEffect(() => {
    window.addEventListener('smartinvest:unauthorized', expireSession)
    return () => window.removeEventListener('smartinvest:unauthorized', expireSession)
  }, [expireSession])

  useEffect(() => {
    if (!session) return
    let timeout = 0
    const expireWhenDue = () => {
      const remaining = Date.parse(session.expiresAt) - Date.now()
      if (remaining <= 0) {
        expireSession()
      } else {
        timeout = window.setTimeout(expireWhenDue, Math.min(remaining, 2_147_000_000))
      }
    }
    expireWhenDue()
    return () => window.clearTimeout(timeout)
  }, [expireSession, session])

  const login = useCallback(async (request: LoginRequest) => {
    const result = await loginUser(request)
    if (result.tokenType !== 'Bearer') {
      throw new Error('The authentication service returned an unsupported token type.')
    }
    saveStoredSession(result)
    setSession(result)
  }, [])

  const register = useCallback((request: RegisterRequest) => registerUser(request), [])

  const logout = useCallback(async () => {
    const activeSession = session
    clearStoredSession()
    setSession(null)
    if (!activeSession) return true

    try {
      await logoutUser(activeSession.accessToken)
      return true
    } catch {
      return false
    }
  }, [session])

  const value = useMemo(
    () => ({ session, login, register, logout }),
    [session, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
