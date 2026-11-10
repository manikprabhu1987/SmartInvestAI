import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { LoginPage } from './LoginPage'
import { SESSION_STORAGE_KEY } from './sessionStorage'

const { loginUserMock } = vi.hoisted(() => ({ loginUserMock: vi.fn() }))
vi.mock('../api/authApi', () => ({
  loginUser: loginUserMock,
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
}))

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app/watchlist" element={<p>Private watchlist</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('LoginPage', () => {
  it('signs in and stores the access token before entering the private app', async () => {
    const user = userEvent.setup()
    loginUserMock.mockResolvedValue({
      accessToken: 'login-token',
      tokenType: 'Bearer',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 2, name: 'Taylor Investor', email: 'taylor@example.test' },
    })
    renderLogin()

    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'taylor@example.test')
    await user.type(screen.getByLabelText(/Password/), 'a-secure-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Private watchlist')).toBeInTheDocument()
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toContain('login-token')
  })

  it('shows invalid-credential errors and does not create a session', async () => {
    loginUserMock.mockRejectedValue({
      response: { status: 401, data: { detail: 'Email or password is incorrect.' } },
    })
    renderLogin()
    fireEvent.change(screen.getByRole('textbox', { name: /Email/ }), {
      target: { value: 'taylor@example.test' },
    })
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email or password is incorrect.',
    )
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })
})
