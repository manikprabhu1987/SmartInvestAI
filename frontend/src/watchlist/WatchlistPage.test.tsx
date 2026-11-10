import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { addWatchlistStock, getWatchlist, removeWatchlistStock } from '../api/watchlistApi'
import type { WatchlistEntry } from '../api/types'
import { WatchlistPage } from './WatchlistPage'

vi.mock('../api/watchlistApi', () => ({
  getWatchlist: vi.fn(),
  addWatchlistStock: vi.fn(),
  removeWatchlistStock: vi.fn(),
}))

const apple: WatchlistEntry = {
  id: 1,
  stock: { symbol: 'AAPL', companyName: 'Apple Inc.', exchangeCode: 'NASDAQ', active: true },
  addedAt: '2026-11-10T00:00:00Z',
}

describe('WatchlistPage', () => {
  beforeEach(() => vi.resetAllMocks())

  it('shows an empty state and updates only after add and remove succeed', async () => {
    const user = userEvent.setup()
    vi.mocked(getWatchlist).mockResolvedValue({ items: [] })
    vi.mocked(addWatchlistStock).mockResolvedValue(apple)
    vi.mocked(removeWatchlistStock).mockResolvedValue({ symbol: 'AAPL', removed: true })
    render(<MemoryRouter><WatchlistPage /></MemoryRouter>)

    expect(await screen.findByText('Your watchlist is ready')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Stock symbol'), 'AAPL')
    await user.click(screen.getByRole('button', { name: 'Add stock' }))
    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument()
    expect(addWatchlistStock).toHaveBeenCalledWith({ symbol: 'AAPL' })

    await user.click(screen.getByRole('button', { name: 'Remove AAPL' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Remove stock' }))
    await waitFor(() => expect(removeWatchlistStock).toHaveBeenCalledWith('AAPL'))
    expect(await screen.findByText('AAPL removed from your watchlist.')).toBeInTheDocument()
    expect(screen.queryByText('Apple Inc.')).not.toBeInTheDocument()
  })

  it('keeps an entry visible and reports a failed removal', async () => {
    const user = userEvent.setup()
    vi.mocked(getWatchlist).mockResolvedValue({ items: [apple] })
    vi.mocked(removeWatchlistStock).mockRejectedValue({
      response: { status: 503, data: { detail: 'Removal is temporarily unavailable.' } },
    })
    render(<MemoryRouter><WatchlistPage /></MemoryRouter>)
    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove AAPL' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Remove stock' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Removal is temporarily unavailable.')
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
  })

  it('reports an empty symbol without calling the API', async () => {
    vi.mocked(getWatchlist).mockResolvedValue({ items: [] })
    render(<MemoryRouter><WatchlistPage /></MemoryRouter>)
    await screen.findByText('Your watchlist is ready')
    fireEvent.click(screen.getByRole('button', { name: 'Add stock' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a stock symbol.')
    expect(addWatchlistStock).not.toHaveBeenCalled()
  })
})
