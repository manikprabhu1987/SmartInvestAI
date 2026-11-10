import { useCallback, useEffect, useState } from 'react'
import { getApiError } from '../api/httpClient'
import {
  addWatchlistStock,
  getWatchlist,
  removeWatchlistStock,
} from '../api/watchlistApi'
import type { WatchlistEntry } from '../api/types'

interface WatchlistState {
  entries: WatchlistEntry[]
  loading: boolean
  error: string
}

export function useWatchlist() {
  const [state, setState] = useState<WatchlistState>({
    entries: [],
    loading: true,
    error: '',
  })

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const response = await getWatchlist()
      setState({ entries: response.items, loading: false, error: '' })
    } catch (reason) {
      setState((current) => ({
        ...current,
        loading: false,
        error: getApiError(reason).message,
      }))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const add = useCallback(async (symbol: string) => {
    setState((current) => ({ ...current, error: '' }))
    try {
      const entry = await addWatchlistStock({ symbol: symbol.trim() })
      setState((current) => ({
        ...current,
        entries: [
          entry,
          ...current.entries.filter((existing) => existing.stock.symbol !== entry.stock.symbol),
        ],
      }))
      return entry
    } catch (reason) {
      setState((current) => ({ ...current, error: getApiError(reason).message }))
      throw reason
    }
  }, [])

  const remove = useCallback(async (symbol: string) => {
    setState((current) => ({ ...current, error: '' }))
    try {
      await removeWatchlistStock(symbol)
      setState((current) => ({
        ...current,
        entries: current.entries.filter(
          (entry) => entry.stock.symbol.toUpperCase() !== symbol.toUpperCase(),
        ),
      }))
    } catch (reason) {
      setState((current) => ({ ...current, error: getApiError(reason).message }))
      throw reason
    }
  }, [])

  return { ...state, load, add, remove }
}
