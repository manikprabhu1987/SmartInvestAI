import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchStocks } from '../api/stockApi'
import { useStockSearch } from './useStockSearch'

vi.mock('../api/stockApi', () => ({ searchStocks: vi.fn() }))

const firstPage = {
  items: [
    { symbol: 'AAPL', companyName: 'Apple Inc.', exchangeCode: 'NASDAQ', active: true },
  ],
  page: 0,
  size: 20,
  hasNext: true,
}

describe('useStockSearch', () => {
  beforeEach(() => vi.resetAllMocks())

  it('queries the first and next pages with the backend page size and metadata', async () => {
    vi.mocked(searchStocks).mockResolvedValueOnce(firstPage).mockResolvedValueOnce({
      ...firstPage,
      items: [],
      page: 1,
      hasNext: false,
    })
    const { result } = renderHook(() => useStockSearch())

    await act(async () => result.current.search('apple'))
    await waitFor(() => expect(result.current.results?.page).toBe(0))
    await act(async () => result.current.goToPage(1))
    await waitFor(() => expect(result.current.results?.page).toBe(1))

    expect(searchStocks).toHaveBeenNthCalledWith(1, 'apple', 0, 20, expect.any(AbortSignal))
    expect(searchStocks).toHaveBeenNthCalledWith(2, 'apple', 1, 20, expect.any(AbortSignal))
    expect(result.current.results?.hasNext).toBe(false)
  })

  it('rejects blank queries and clears the previous result state', async () => {
    const { result } = renderHook(() => useStockSearch())
    await act(async () => result.current.search('   '))
    expect(searchStocks).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Enter a symbol or company name to search.')
    expect(result.current.results).toBeNull()
  })
})
