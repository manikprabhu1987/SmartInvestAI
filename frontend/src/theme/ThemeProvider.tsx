import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { getInitialColorMode, storeColorMode, type ColorMode } from './themePreference'

interface ColorModeContextValue {
  mode: ColorMode
  toggleMode: () => void
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null)

export function ColorModeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ColorMode>(() => getInitialColorMode())

  const toggleMode = useCallback(() => {
    setMode((currentMode) => {
      const nextMode = currentMode === 'light' ? 'dark' : 'light'
      storeColorMode(nextMode)
      return nextMode
    })
  }, [])

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === 'light' ? '#176b5b' : '#79d8be' },
          secondary: { main: mode === 'light' ? '#ba6a2c' : '#ffc28f' },
          background: {
            default: mode === 'light' ? '#f5f7f6' : '#111a19',
            paper: mode === 'light' ? '#ffffff' : '#1a2624',
          },
        },
        shape: { borderRadius: 12 },
        typography: {
          fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
          h1: { fontWeight: 800, letterSpacing: '-0.04em' },
          h2: { fontWeight: 750, letterSpacing: '-0.035em' },
          button: { textTransform: 'none', fontWeight: 700 },
        },
      }),
    [mode],
  )

  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode])
  return (
    <ColorModeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  )
}

export function useColorMode(): ColorModeContextValue {
  const context = useContext(ColorModeContext)
  if (!context) throw new Error('useColorMode must be used within ColorModeProvider.')
  return context
}
