import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import QueryStatsRounded from '@mui/icons-material/QueryStatsRounded'
import { Link as RouterLink } from 'react-router-dom'
import type { WatchlistEntry } from '../api/types'
import { AddStockForm } from './AddStockForm'
import { useWatchlist } from './useWatchlist'
import { StockQuoteDisplay } from '../stocks/StockQuoteDisplay'

export function WatchlistPage() {
  const { entries, loading, error, add, remove } = useWatchlist()
  const [selectedEntry, setSelectedEntry] = useState<WatchlistEntry | null>(null)
  const [removing, setRemoving] = useState(false)
  const [success, setSuccess] = useState('')

  const confirmRemoval = async () => {
    if (!selectedEntry) return
    setRemoving(true)
    setSuccess('')
    try {
      await remove(selectedEntry.stock.symbol)
      setSuccess(`${selectedEntry.stock.symbol} removed from your watchlist.`)
      setSelectedEntry(null)
    } catch {
      setSelectedEntry(null)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary.main" fontWeight={800}>
          Your portfolio workspace
        </Typography>
        <Typography variant="h1" sx={{ fontSize: { xs: 32, sm: 42 }, mt: 0.5 }}>
          Watchlist
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Keep the companies you follow together in one place.
        </Typography>
      </Box>

      <AddStockForm onAdd={add} />

      <Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={1.5}
          mb={2}
        >
          <Box>
            <Typography variant="h5" fontWeight={750}>Your stocks</Typography>
            <Typography variant="body2" color="text.secondary">
              {entries.length} {entries.length === 1 ? 'company' : 'companies'} saved
            </Typography>
          </Box>
          <Button component={RouterLink} to="/app/stocks" startIcon={<QueryStatsRounded />}>
            Find stocks
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {loading ? (
          <Box display="grid" justifyItems="center" py={6}>
            <CircularProgress aria-label="Loading watchlist" />
          </Box>
        ) : entries.length === 0 ? (
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: { xs: 5, sm: 7 } }}>
              <QueryStatsRounded color="primary" sx={{ fontSize: 42, mb: 1 }} />
              <Typography variant="h6" fontWeight={750}>Your watchlist is ready</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                Search for a company or add its symbol to start following it.
              </Typography>
              <Button component={RouterLink} to="/app/stocks" variant="contained">
                Search stocks
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {entries.map((entry) => (
              <Card key={entry.id} variant="outlined">
                <CardContent
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    '&:last-child': { pb: 2 },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Typography fontWeight={800} color="primary.main">
                      {entry.stock.symbol.slice(0, 1)}
                    </Typography>
                  </Box>
                  <Box minWidth={0} flexGrow={1}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="subtitle1" fontWeight={800}>
                        {entry.stock.symbol}
                      </Typography>
                      {entry.stock.exchangeCode && (
                        <Chip label={entry.stock.exchangeCode} size="small" variant="outlined" />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {entry.stock.companyName}
                    </Typography>
                    <StockQuoteDisplay quote={entry.stock.quote} />
                  </Box>
                  <Button
                    aria-label={`Remove ${entry.stock.symbol}`}
                    color="inherit"
                    onClick={() => setSelectedEntry(entry)}
                    size="small"
                    startIcon={<DeleteOutlineRounded />}
                  >
                    <Box display={{ xs: 'none', sm: 'inline' }}>Remove</Box>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      <Dialog open={Boolean(selectedEntry)} onClose={() => !removing && setSelectedEntry(null)}>
        <DialogTitle>Remove stock?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove {selectedEntry?.stock.symbol} from your watchlist?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEntry(null)} disabled={removing}>Cancel</Button>
          <Button onClick={() => void confirmRemoval()} color="error" disabled={removing}>
            {removing ? 'Removing…' : 'Remove stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
