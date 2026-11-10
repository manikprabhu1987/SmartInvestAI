import { describe, expect, it } from 'vitest'
import { validateRegistration } from './validation'

describe('validateRegistration', () => {
  it('requires a name, valid email, and a 12-character password', () => {
    expect(validateRegistration('', 'not-an-email', 'short')).toEqual({
      name: 'Enter your name.',
      email: 'Enter a valid email address.',
      password: 'Use at least 12 characters.',
    })
  })

  it('accepts valid registration fields', () => {
    expect(validateRegistration('Taylor', 'taylor@example.test', 'a-long-password')).toEqual({})
  })
})
