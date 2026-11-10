import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { RegisterPage } from './RegisterPage'

const { registerUserMock } = vi.hoisted(() => ({ registerUserMock: vi.fn() }))
vi.mock('../api/authApi', () => ({
  loginUser: vi.fn(),
  registerUser: registerUserMock,
  logoutUser: vi.fn(),
}))

function renderRegister() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<p>Sign in to SmartInvest AI</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('RegisterPage', () => {
  it('submits a valid registration and directs the user to login', async () => {
    const user = userEvent.setup()
    registerUserMock.mockResolvedValue({
      id: 5,
      name: 'Taylor Investor',
      email: 'taylor@example.test',
    })
    renderRegister()

    await user.type(screen.getByRole('textbox', { name: /Full name/ }), 'Taylor Investor')
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'taylor@example.test')
    await user.type(screen.getByLabelText(/Password/), 'a-secure-password')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Sign in to SmartInvest AI')).toBeInTheDocument()
    expect(registerUserMock).toHaveBeenCalledWith({
      name: 'Taylor Investor',
      email: 'taylor@example.test',
      password: 'a-secure-password',
    })
  })

  it('shows backend registration errors without creating a session', async () => {
    registerUserMock.mockRejectedValue({
      response: { status: 409, data: { detail: 'Email is already registered.' } },
    })
    renderRegister()
    fireEvent.change(screen.getByRole('textbox', { name: /Full name/ }), { target: { value: 'Taylor' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Email/ }), {
      target: { value: 'taylor@example.test' },
    })
    fireEvent.change(screen.getByLabelText(/Password/), {
      target: { value: 'a-secure-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is already registered.')
    await waitFor(() => expect(sessionStorage.length).toBe(0))
  })
})
