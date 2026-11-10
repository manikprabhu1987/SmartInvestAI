const API_PATH = '/api/v1'

export function normalizeApiBaseUrl(apiOrigin?: string): string {
  const configuredOrigin = apiOrigin?.trim()
  if (!configuredOrigin) {
    return API_PATH
  }

  if (configuredOrigin.startsWith('/')) {
    const relativeUrl = new URL(configuredOrigin, window.location.origin)
    if (relativeUrl.pathname.replace(/\/+$/, '') !== API_PATH || relativeUrl.search || relativeUrl.hash) {
      throw new Error('The API origin must be a root origin or end with /api/v1.')
    }
    return `${relativeUrl.pathname.replace(/\/+$/, '')}`
  }

  let url: URL
  try {
    url = new URL(configuredOrigin)
  } catch {
    throw new Error('The configured API origin is not a valid URL.')
  }

  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== '/' && url.pathname.replace(/\/+$/, '') !== API_PATH)
  ) {
    throw new Error('The API origin must be an HTTP(S) origin with an optional /api/v1 path.')
  }

  return `${url.origin}${API_PATH}`
}

export function getApiBaseUrl(): string {
  return normalizeApiBaseUrl(
    window.__SMARTINVEST_CONFIG__?.apiOrigin || import.meta.env.VITE_API_ORIGIN,
  )
}
