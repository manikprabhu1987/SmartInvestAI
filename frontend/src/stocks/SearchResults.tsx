import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import type { StockSummary } from '../api/types'
import { StockQuoteDisplay } from './StockQuoteDisplay'

interface SearchResultsProps {
  stocks: StockSummary[]
  addingSymbol: string
  addedSymbol: string
  onAdd: (stock: StockSummary) => void
}

export function SearchResults({ stocks, addingSymbol, addedSymbol, onAdd }: SearchResultsProps) {
  return (
    <Stack spacing={1.5}>
      {stocks.map((stock) => (
        <Card key={stock.symbol} variant="outlined">
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: 2,
                bgcolor: 'action.hover',
              }}
            >
              <Typography fontWeight={800} color="primary.main">
                {stock.symbol.slice(0, 1)}
              </Typography>
            </Box>
            <Box minWidth={0} flexGrow={1}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography fontWeight={800}>{stock.symbol}</Typography>
                {stock.exchangeCode && (
                  <Chip label={stock.exchangeCode} size="small" variant="outlined" />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary" noWrap>
                {stock.companyName}
              </Typography>
              <StockQuoteDisplay quote={stock.quote} />
            </Box>
            {addedSymbol === stock.symbol ? (
              <Chip color="success" label="Added" size="small" />
            ) : (
              <Button
                aria-label={`Add ${stock.symbol} to watchlist`}
                disabled={addingSymbol === stock.symbol}
                onClick={() => onAdd(stock)}
                size="small"
                startIcon={<AddRounded />}
              >
                {addingSymbol === stock.symbol ? 'Adding…' : 'Add'}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}
