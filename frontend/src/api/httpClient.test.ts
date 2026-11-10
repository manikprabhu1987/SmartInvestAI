import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { createApiClient, getApiError } from './httpClient'

function adapterFor(
  handle: (config: InternalAxiosRequestConfig) => unknown | Promise<unknown>,
  status = 200,
): AxiosAdapter {
  return async (config) => {
    const data = await handle(config)
    if (status >= 400) {
      throw new AxiosError(
        'Request failed',
        AxiosError.ERR_BAD_REQUEST,
        config,
        undefined,
        { data, status, statusText: 'Error', headers: {}, config },
      )
    }

    return { data, status, statusText: 'OK', headers: {}, config }
  }
}

describe('API client', () => {
  it('attaches bearer tokens only to authenticated requests for the configured API origin', async () => {
    const seen: Array<{ url: string; authorization?: string }> = []
    const client = createApiClient({
      baseURL: 'https://api.example.test/api/v1',
      getAccessToken: () => 'secret-token',
      onUnauthorized: () => undefined,
      adapter: adapterFor((config) => {
        seen.push({
          url: config.url ?? '',
          authorization: config.headers.get('Authorization') as string | undefined,
        })
        return { ok: true }
      }),
    })

    await client.get('/watchlist', { requiresAuth: true })
    await client.get('https://other.example.test/pixel', { requiresAuth: true })
    await client.get('/auth/login')

    expect(seen).toHaveLength(3)
    expect(seen[0].authorization).toBe('Bearer secret-token')
    expect(seen[1].authorization).toBeUndefined()
    expect(seen[2].authorization).toBeUndefined()
  })

  it('clears the unauthorized session callback when a protected API returns 401', async () => {
    const onUnauthorized = vi.fn()
    const client = createApiClient({
      baseURL: 'https://api.example.test/api/v1',
      getAccessToken: () => 'expired-token',
      onUnauthorized,
      adapter: adapterFor(() => ({ detail: 'Authentication required' }), 401),
    })

    await expect(client.get('/watchlist', { requiresAuth: true })).rejects.toBeInstanceOf(
      AxiosError,
    )
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('extracts safe Problem Details messages and falls back for unknown failures', () => {
    const response = {
      response: {
        data: {
          detail: 'This stock is already on your watchlist.',
          code: 'WATCHLIST_DUPLICATE',
        },
      },
    }

    expect(getApiError(response)).toEqual({
      message: 'This stock is already on your watchlist.',
      code: 'WATCHLIST_DUPLICATE',
    })
    expect(getApiError(new Error('socket disconnected')).message).toBe(
      'The request could not be completed. Check your connection and try again.',
    )
  })
})
