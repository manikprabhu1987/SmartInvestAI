import { Stack, Typography } from '@mui/material'
import type { StockQuote } from '../api/types'

interface StockQuoteDisplayProps {
  quote: StockQuote | null | undefined
}

const currencyFormatters = new Map<string, Intl.NumberFormat>()

function formatPrice(price: number, currency: string) {
  let formatter = currencyFormatters.get(currency)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    currencyFormatters.set(currency, formatter)
  }
  return formatter.format(price)
}

export function StockQuoteDisplay({ quote }: StockQuoteDisplayProps) {
  if (!quote || quote.status !== 'AVAILABLE' || quote.lastPrice === null || !quote.currency) {
    return (
      <Typography variant="caption" color="text.secondary">
        {quote?.message ?? 'End-of-day price unavailable.'}
      </Typography>
    )
  }

  const marketDateLabel = quote.marketDate
    ? `Market date ${new Date(`${quote.marketDate}T00:00:00`).toLocaleDateString('en-IN', {
        dateStyle: 'medium',
      })}`
    : 'Market date unavailable'

  return (
    <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
      <Typography variant="subtitle2" fontWeight={750}>
        {formatPrice(quote.lastPrice, quote.currency)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {quote.source} · EOD · {marketDateLabel}
      </Typography>
    </Stack>
  )
}
