import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addWatchlistStock } from '../api/watchlistApi'
import { searchStocks } from '../api/stockApi'
import type { WatchlistEntry } from '../api/types'
import { StockSearchPage } from './StockSearchPage'

vi.mock('../api/stockApi', () => ({ searchStocks: vi.fn() }))
vi.mock('../api/watchlistApi', () => ({
  addWatchlistStock: vi.fn(),
  getWatchlist: vi.fn(),
  removeWatchlistStock: vi.fn(),
}))

const apple = {
  symbol: 'AAPL',
  companyName: 'Apple Inc.',
  exchangeCode: 'NASDAQ',
  active: true,
}

describe('StockSearchPage', () => {
  beforeEach(() => vi.resetAllMocks())

  it('searches, paginates, and adds a result to the watchlist', async () => {
    const user = userEvent.setup()
    vi.mocked(searchStocks).mockResolvedValueOnce({
      items: [apple],
      page: 0,
      size: 20,
      hasNext: true,
    }).mockResolvedValueOnce({
      items: [],
      page: 1,
      size: 20,
      hasNext: false,
    })
    vi.mocked(addWatchlistStock).mockResolvedValue({
      id: 10,
      stock: apple,
      addedAt: '2026-11-10T00:00:00Z',
    } satisfies WatchlistEntry)
    render(<StockSearchPage />)

    await user.type(screen.getByLabelText('Symbol or company name'), 'Apple')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add AAPL to watchlist' }))
    expect(await screen.findByText('AAPL added to your watchlist.')).toBeInTheDocument()
    expect(addWatchlistStock).toHaveBeenCalledWith({ symbol: 'AAPL' })

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('No stocks matched “Apple”. Try another search.')).toBeInTheDocument()
    expect(searchStocks).toHaveBeenNthCalledWith(2, 'Apple', 1, 20, expect.any(AbortSignal))
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('rejects a blank query and does not make an API request', async () => {
    render(<StockSearchPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter a symbol or company name to search.',
    )
    await waitFor(() => expect(searchStocks).not.toHaveBeenCalled())
  })

  it('shows an actionable search error', async () => {
    vi.mocked(searchStocks).mockRejectedValue({
      response: { status: 503, data: { detail: 'Stock catalog is unavailable.' } },
    })
    render(<StockSearchPage />)
    fireEvent.change(screen.getByLabelText('Symbol or company name'), {
      target: { value: 'AAPL' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Stock catalog is unavailable.')
  })
})
