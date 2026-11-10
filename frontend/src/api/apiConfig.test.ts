import { afterEach, describe, expect, it, vi } from 'vitest'
import { getApiBaseUrl, normalizeApiBaseUrl } from './apiConfig'

afterEach(() => {
  vi.unstubAllEnvs()
  delete window.__SMARTINVEST_CONFIG__
})

describe('normalizeApiBaseUrl', () => {
  it('adds the API version path to a configured origin', () => {
    expect(normalizeApiBaseUrl('https://api.example.test')).toBe(
      'https://api.example.test/api/v1',
    )
  })

  it('does not duplicate the API version path', () => {
    expect(normalizeApiBaseUrl('https://api.example.test/api/v1/')).toBe(
      'https://api.example.test/api/v1',
    )
  })

  it('supports same-origin runtime configuration', () => {
    expect(normalizeApiBaseUrl(undefined)).toBe('/api/v1')
  })

  it('uses the Vite API origin when runtime configuration is empty', () => {
    window.__SMARTINVEST_CONFIG__ = { apiOrigin: '' }
    vi.stubEnv('VITE_API_ORIGIN', 'https://api.example.test')

    expect(getApiBaseUrl()).toBe('https://api.example.test/api/v1')
  })

  it('rejects unsafe origins and unexpected paths', () => {
    expect(() => normalizeApiBaseUrl('ftp://api.example.test')).toThrow()
    expect(() => normalizeApiBaseUrl('https://user:pass@api.example.test')).toThrow()
    expect(() => normalizeApiBaseUrl('https://api.example.test/internal')).toThrow()
  })
})
