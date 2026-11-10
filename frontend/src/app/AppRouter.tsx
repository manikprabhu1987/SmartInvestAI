import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { LoginPage } from '../auth/LoginPage'
import { RegisterPage } from '../auth/RegisterPage'
import { StockSearchPage } from '../stocks/StockSearchPage'
import { WatchlistPage } from '../watchlist/WatchlistPage'
import { AppShell } from './AppShell'
import { ProtectedRoute } from './ProtectedRoute'

function HomeRedirect() {
  const { session } = useAuth()
  return <Navigate to={session ? '/app/watchlist' : '/login'} replace />
}

function AuthenticatedShell() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  )
}

export function AppRouter() {
  const location = useLocation()
  return (
    <Routes location={location}>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/app" element={<AuthenticatedShell />}>
        <Route index element={<Navigate to="watchlist" replace />} />
        <Route path="watchlist" element={<WatchlistPage />} />
        <Route path="stocks" element={<StockSearchPage />} />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
