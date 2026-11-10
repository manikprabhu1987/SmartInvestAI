import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { SESSION_STORAGE_KEY } from '../auth/sessionStorage'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('../api/authApi', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
}))

function LocationProbe() {
  const location = useLocation()
  return <p>Current route: {location.pathname}</p>
}

function renderProtected(initialEntry: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LocationProbe />} />
          <Route
            path="/app/watchlist"
            element={
              <ProtectedRoute>
                <p>Private watchlist</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects an anonymous visitor to login', () => {
    renderProtected('/app/watchlist')
    expect(screen.getByText('Current route: /login')).toBeInTheDocument()
  })

  it('allows a visitor with a valid browser session', () => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'test-token',
        tokenType: 'Bearer',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'Taylor Investor', email: 'taylor@example.test' },
      }),
    )
    renderProtected('/app/watchlist')
    expect(screen.getByText('Private watchlist')).toBeInTheDocument()
  })
})
