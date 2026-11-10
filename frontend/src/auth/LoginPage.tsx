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
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { getApiError } from '../api/httpClient'
import { useAuth } from './AuthProvider'

interface LoginLocationState {
  from?: { pathname?: string }
  registered?: boolean
  logoutWarning?: string
}

export function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as LoginLocationState
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      const returnPath = state.from?.pathname?.startsWith('/app')
        ? state.from.pathname
        : '/app/watchlist'
      navigate(returnPath, { replace: true })
    } catch (reason) {
      setError(getApiError(reason).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 5, sm: 9 } }}>
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
              Welcome back
            </Typography>
            <Typography color="text.secondary">Sign in to keep your watchlist close.</Typography>
          </Box>
          {state.registered && (
            <Alert severity="success">Account created. Sign in to continue.</Alert>
          )}
          {state.logoutWarning && <Alert severity="warning">{state.logoutWarning}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <Box component="form" onSubmit={(event) => void handleSubmit(event)} noValidate>
            <Stack spacing={2.25}>
              <TextField
                autoComplete="email"
                autoFocus
                fullWidth
                label="Email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
              <TextField
                autoComplete="current-password"
                fullWidth
                label="Password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </Stack>
          </Box>
          <Typography textAlign="center" color="text.secondary">
            New to SmartInvest?{' '}
            <Link component={RouterLink} to="/register" fontWeight={700}>
              Create an account
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  )
}
