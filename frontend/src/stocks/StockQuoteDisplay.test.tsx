import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { StockQuote } from '../api/types'
import { StockQuoteDisplay } from './StockQuoteDisplay'

describe('StockQuoteDisplay', () => {
  it('renders the quote, provider, and market date', () => {
    const quote: StockQuote = {
      status: 'AVAILABLE',
      lastPrice: 1234.5,
      currency: 'INR',
      marketDate: '2026-11-10',
      source: 'TWELVE_DATA',
      message: null,
    }

    render(<StockQuoteDisplay quote={quote} />)

    expect(screen.getByText('₹1,234.50')).toBeInTheDocument()
    expect(screen.getByText(/TWELVE_DATA · EOD · Market date/)).toBeInTheDocument()
  })

  it('explains why the EOD price is unavailable instead of showing a placeholder price', () => {
    render(
      <StockQuoteDisplay
        quote={{
          status: 'UNAVAILABLE',
          lastPrice: null,
          currency: null,
          marketDate: null,
          source: 'TWELVE_DATA',
          message: 'Twelve Data API key is not configured.',
        }}
      />,
    )

    expect(screen.getByText('Twelve Data API key is not configured.')).toBeInTheDocument()
    expect(screen.queryByText(/₹/)).not.toBeInTheDocument()
  })
})
