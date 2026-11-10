import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ColorModeProvider, useColorMode } from './ThemeProvider'
import { THEME_STORAGE_KEY } from './themePreference'

function ThemeProbe() {
  const { mode, toggleMode } = useColorMode()
  return (
    <>
      <p>Theme: {mode}</p>
      <button onClick={toggleMode}>Toggle theme</button>
    </>
  )
}

describe('ColorModeProvider', () => {
  it('restores a saved theme and persists a user selection', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    render(
      <ColorModeProvider>
        <ThemeProbe />
      </ColorModeProvider>,
    )

    expect(screen.getByText('Theme: dark')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Toggle theme' }))
    expect(screen.getByText('Theme: light')).toBeInTheDocument()
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })
})
