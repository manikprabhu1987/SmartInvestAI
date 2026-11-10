import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Link,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import ShowChartRounded from '@mui/icons-material/ShowChartRounded'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useColorMode } from '../theme/ThemeProvider'

export function AppShell() {
  const { session, logout } = useAuth()
  const { mode, toggleMode } = useColorMode()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const revoked = await logout()
    navigate('/login', {
      replace: true,
      state: revoked
        ? undefined
        : { logoutWarning: 'Signed out locally, but the server could not confirm token revocation.' },
    })
  }

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar
          sx={{
            gap: { xs: 1, sm: 2 },
            minHeight: { xs: 64, sm: 72 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            py: { xs: 1, sm: 0 },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1 }}>
            <ShowChartRounded color="primary" />
            <Link component={RouterLink} to="/app/watchlist" variant="h6" fontWeight={800} color="text.primary" underline="none">
              SmartInvest <Box component="span" color="primary.main">AI</Box>
            </Link>
          </Stack>
          <Stack
            component="nav"
            aria-label="Main navigation"
            direction="row"
            spacing={{ xs: 0.5, sm: 1 }}
            alignItems="center"
          >
            <Button
              component={RouterLink}
              to="/app/watchlist"
              color={location.pathname === '/app/watchlist' ? 'primary' : 'inherit'}
              aria-current={location.pathname === '/app/watchlist' ? 'page' : undefined}
              size="small"
            >
              Watchlist
            </Button>
            <Button
              component={RouterLink}
              to="/app/stocks"
              color={location.pathname === '/app/stocks' ? 'primary' : 'inherit'}
              aria-current={location.pathname === '/app/stocks' ? 'page' : undefined}
              size="small"
            >
              Search
            </Button>
          </Stack>
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton aria-label="Toggle theme" onClick={toggleMode} color="primary">
              {mode === 'light' ? <DarkModeRounded /> : <LightModeRounded />}
            </IconButton>
          </Tooltip>
          <Box display={{ xs: 'none', md: 'block' }}>
            <Typography variant="body2" color="text.secondary">
              {session?.user.name}
            </Typography>
          </Box>
          <Button onClick={() => void handleLogout()} color="inherit" size="small">
            Log out
          </Button>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, sm: 5 }, flexGrow: 1 }}>
        <Outlet />
      </Container>
      <Box component="footer" py={2} textAlign="center" color="text.secondary">
        <Typography variant="caption">Market data and watchlists are provided by SmartInvest AI.</Typography>
      </Box>
    </Box>
  )
}
