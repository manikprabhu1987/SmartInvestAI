import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthProvider'
import { SESSION_STORAGE_KEY } from './sessionStorage'

const { loginUserMock, registerUserMock, logoutUserMock } = vi.hoisted(() => ({
  loginUserMock: vi.fn(),
  registerUserMock: vi.fn(),
  logoutUserMock: vi.fn(),
}))

vi.mock('../api/authApi', () => ({
  loginUser: loginUserMock,
  registerUser: registerUserMock,
  logoutUser: logoutUserMock,
}))

const validSession = {
  accessToken: 'session-token',
  tokenType: 'Bearer' as const,
  expiresAt: '2099-01-01T00:00:00Z',
  user: { id: 8, name: 'Taylor Investor', email: 'taylor@example.test' },
}

function AuthProbe() {
  const auth = useAuth()
  return (
    <>
      <p>{auth.session?.user.email ?? 'Signed out'}</p>
      <button onClick={() => void auth.login({ email: 'taylor@example.test', password: 'pass' })}>
        Sign in
      </button>
      <button onClick={() => void auth.logout()}>Sign out</button>
    </>
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('AuthProvider', () => {
  it('stores the returned access token and clears the session on unauthorized event', async () => {
    loginUserMock.mockResolvedValue(validSession)
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('taylor@example.test')).toBeInTheDocument()
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toContain('session-token')

    window.dispatchEvent(new Event('smartinvest:unauthorized'))
    await waitFor(() => expect(screen.getByText('Signed out')).toBeInTheDocument())
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('clears local state even if the logout revocation request fails', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(validSession))
    logoutUserMock.mockRejectedValue(new Error('offline'))
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(screen.getByText('Signed out')).toBeInTheDocument())
    expect(logoutUserMock).toHaveBeenCalledWith('session-token')
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })
})
