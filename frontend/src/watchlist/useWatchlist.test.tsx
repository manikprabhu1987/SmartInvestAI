import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addWatchlistStock, getWatchlist, removeWatchlistStock } from '../api/watchlistApi'
import type { WatchlistEntry } from '../api/types'
import { useWatchlist } from './useWatchlist'

vi.mock('../api/watchlistApi', () => ({
  getWatchlist: vi.fn(),
  addWatchlistStock: vi.fn(),
  removeWatchlistStock: vi.fn(),
}))

const entry: WatchlistEntry = {
  id: 1,
  stock: { symbol: 'AAPL', companyName: 'Apple Inc.', exchangeCode: 'NASDAQ', active: true },
  addedAt: '2026-11-10T00:00:00Z',
}

describe('useWatchlist', () => {
  beforeEach(() => vi.resetAllMocks())

  it('loads the empty state and adds only after the backend confirms success', async () => {
    vi.mocked(getWatchlist).mockResolvedValue({ items: [] })
    vi.mocked(addWatchlistStock).mockResolvedValue(entry)
    const { result } = renderHook(() => useWatchlist())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.entries).toEqual([])

    await act(async () => result.current.add('aapl'))
    expect(addWatchlistStock).toHaveBeenCalledWith({ symbol: 'aapl' })
    expect(result.current.entries).toEqual([entry])
  })

  it('preserves the current list when a removal fails', async () => {
    vi.mocked(getWatchlist).mockResolvedValue({ items: [entry] })
    vi.mocked(removeWatchlistStock).mockRejectedValue({
      response: { status: 503, data: { detail: 'Removal is temporarily unavailable.' } },
    })
    const { result } = renderHook(() => useWatchlist())

    await waitFor(() => expect(result.current.entries).toEqual([entry]))
    await act(async () => {
      await expect(result.current.remove('AAPL')).rejects.toBeDefined()
    })
    expect(result.current.entries).toEqual([entry])
    expect(result.current.error).toBe('Removal is temporarily unavailable.')
  })
})
