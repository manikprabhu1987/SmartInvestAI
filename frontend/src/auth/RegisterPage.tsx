import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ShowChartRounded from '@mui/icons-material/ShowChartRounded'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { getApiError } from '../api/httpClient'
import { useAuth } from './AuthProvider'
import { validateRegistration } from './validation'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validateRegistration>>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const errors = validateRegistration(name, email, password)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    setSubmitting(true)
    try {
      await register({ name: name.trim(), email: email.trim(), password })
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (reason) {
      setError(getApiError(reason).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 7 } }}>
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, border: 1, borderColor: 'divider' }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ShowChartRounded color="primary" fontSize="large" />
            <Typography variant="h5" fontWeight={800}>
              SmartInvest <Box component="span" color="primary.main">AI</Box>
            </Typography>
          </Stack>
          <Box>
            <Typography variant="h1" sx={{ fontSize: { xs: 32, sm: 40 }, mb: 1 }}>
              Create your account
            </Typography>
            <Typography color="text.secondary">
              Build a personal space for the stocks you follow.
            </Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <Box component="form" onSubmit={(event) => void handleSubmit(event)} noValidate>
            <Stack spacing={2.25}>
              <TextField
                autoComplete="name"
                autoFocus
                fullWidth
                label="Full name"
                name="name"
                onChange={(event) => setName(event.target.value)}
                error={Boolean(fieldErrors.name)}
                helperText={fieldErrors.name}
                required
                value={name}
                inputProps={{ maxLength: 255 }}
              />
              <TextField
                autoComplete="email"
                fullWidth
                label="Email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email}
                required
                type="email"
                value={email}
                inputProps={{ maxLength: 320 }}
              />
              <TextField
                autoComplete="new-password"
                fullWidth
                label="Password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                error={Boolean(fieldErrors.password)}
                helperText={fieldErrors.password || 'Use at least 12 characters.'}
                required
                type="password"
                value={password}
                inputProps={{ minLength: 12 }}
              />
              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                {submitting ? 'Creating account…' : 'Create account'}
              </Button>
            </Stack>
          </Box>
          <Typography textAlign="center" color="text.secondary">
            Already registered?{' '}
            <Link component={RouterLink} to="/login" fontWeight={700}>
              Sign in
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  )
}
