import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { AppRouter } from './app/AppRouter'
import { ColorModeProvider } from './theme/ThemeProvider'

function App() {
  return (
    <ColorModeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </ColorModeProvider>
  )
}

export default App
