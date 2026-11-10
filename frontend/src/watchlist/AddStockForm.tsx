import { useState, type FormEvent } from 'react'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import { getApiError } from '../api/httpClient'
import type { WatchlistEntry } from '../api/types'

interface AddStockFormProps {
  onAdd: (symbol: string) => Promise<WatchlistEntry>
}

export function AddStockForm({ onAdd }: AddStockFormProps) {
  const [symbol, setSymbol] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedSymbol = symbol.trim()
    if (!normalizedSymbol) {
      setError('Enter a stock symbol.')
      setSuccess('')
      return
    }
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      const entry = await onAdd(normalizedSymbol)
      setSymbol('')
      setSuccess(`${entry.stock.symbol} added to your watchlist.`)
    } catch (reason) {
      setError(getApiError(reason).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h6" fontWeight={750}>Add a stock</Typography>
          <Typography variant="body2" color="text.secondary">
            Enter a symbol from the supported stock catalog.
          </Typography>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <Box component="form" onSubmit={(event) => void handleSubmit(event)}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              label="Stock symbol"
              name="symbol"
              onChange={(event) => setSymbol(event.target.value)}
              size="small"
              value={symbol}
              inputProps={{ maxLength: 32 }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={<AddRounded />}
              sx={{ minWidth: { sm: 150 } }}
            >
              {submitting ? 'Adding…' : 'Add stock'}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  )
}
