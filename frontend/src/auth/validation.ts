export interface RegistrationFieldErrors {
  name?: string
  email?: string
  password?: string
}

export function validateRegistration(
  name: string,
  email: string,
  password: string,
): RegistrationFieldErrors {
  const errors: RegistrationFieldErrors = {}
  if (!name.trim()) errors.name = 'Enter your name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (password.length < 12) errors.password = 'Use at least 12 characters.'
  return errors
}
