import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SearchRounded from '@mui/icons-material/SearchRounded'
import { addWatchlistStock } from '../api/watchlistApi'
import { getApiError } from '../api/httpClient'
import type { StockSummary } from '../api/types'
import { SearchResults } from './SearchResults'
import { useStockSearch } from './useStockSearch'

export function StockSearchPage() {
  const { page, results, loading, error, search, goToPage } = useStockSearch()
  const [query, setQuery] = useState('')
  const [addingSymbol, setAddingSymbol] = useState('')
  const [addedSymbol, setAddedSymbol] = useState('')
  const [addError, setAddError] = useState('')
  const [addNotice, setAddNotice] = useState('')

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAddError('')
    setAddNotice('')
    search(query)
  }

  const handleAdd = async (stock: StockSummary) => {
    setAddingSymbol(stock.symbol)
    setAddedSymbol('')
    setAddError('')
    setAddNotice('')
    try {
      const entry = await addWatchlistStock({ symbol: stock.symbol })
      setAddedSymbol(entry.stock.symbol)
      setAddNotice(`${entry.stock.symbol} added to your watchlist.`)
    } catch (reason) {
      setAddError(getApiError(reason).message)
    } finally {
      setAddingSymbol('')
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary.main" fontWeight={800}>
          Explore the catalog
        </Typography>
        <Typography variant="h1" sx={{ fontSize: { xs: 32, sm: 42 }, mt: 0.5 }}>
          Find a stock
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Search by ticker symbol or company name.
        </Typography>
      </Box>

      <Paper component="form" onSubmit={handleSearch} variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            fullWidth
            label="Symbol or company name"
            name="query"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try AAPL or Apple"
            size="small"
            value={query}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<SearchRounded />}
            disabled={loading}
            sx={{ minWidth: { sm: 140 } }}
          >
            Search
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {addError && <Alert severity="error">{addError}</Alert>}
      {addNotice && <Alert severity="success">{addNotice}</Alert>}

      {loading && (
        <Box display="grid" justifyItems="center" py={4}>
          <CircularProgress aria-label="Searching stocks" />
        </Box>
      )}
      {!loading && results && (
        <Box>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            spacing={1}
            mb={2}
          >
            <Box>
              <Typography variant="h5" fontWeight={750}>Search results</Typography>
              <Typography variant="body2" color="text.secondary">
                Page {results.page + 1} · {results.items.length} matches
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                disabled={results.page === 0}
                onClick={() => goToPage(results.page - 1)}
                size="small"
              >
                Previous
              </Button>
              <Button
                disabled={!results.hasNext}
                onClick={() => goToPage(results.page + 1)}
                size="small"
              >
                Next
              </Button>
            </Stack>
          </Stack>
          {results.items.length === 0 ? (
            <Alert severity="info">No stocks matched “{query.trim()}”. Try another search.</Alert>
          ) : (
            <SearchResults
              stocks={results.items}
              addingSymbol={addingSymbol}
              addedSymbol={addedSymbol}
              onAdd={(stock) => void handleAdd(stock)}
            />
          )}
          <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
            Page {page + 1} of the stock catalog
          </Typography>
        </Box>
      )}
    </Stack>
  )
}
