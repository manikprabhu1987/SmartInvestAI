export const THEME_STORAGE_KEY = 'smartinvest.theme'

export type ColorMode = 'light' | 'dark'

export function getInitialColorMode(): ColorMode {
  const storedMode = localStorage.getItem(THEME_STORAGE_KEY)
  if (storedMode === 'light' || storedMode === 'dark') return storedMode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function storeColorMode(mode: ColorMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode)
}
