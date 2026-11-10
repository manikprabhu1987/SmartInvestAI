import { apiClient } from './httpClient'
import type {
  AddWatchlistStockRequest,
  RemoveWatchlistStockResponse,
  WatchlistEntry,
  WatchlistResponse,
} from './types'

export async function getWatchlist(): Promise<WatchlistResponse> {
  const response = await apiClient.get<WatchlistResponse>('/watchlist', { requiresAuth: true })
  return response.data
}

export async function addWatchlistStock(
  request: AddWatchlistStockRequest,
): Promise<WatchlistEntry> {
  const response = await apiClient.post<WatchlistEntry>('/watchlist', request, {
    requiresAuth: true,
  })
  return response.data
}

export async function removeWatchlistStock(symbol: string): Promise<RemoveWatchlistStockResponse> {
  const response = await apiClient.delete<RemoveWatchlistStockResponse>(
    `/watchlist/${encodeURIComponent(symbol)}`,
    { requiresAuth: true },
  )
  return response.data
}
