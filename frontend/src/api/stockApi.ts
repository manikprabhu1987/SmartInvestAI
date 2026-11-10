import { apiClient } from './httpClient'
import type { StockSearchPage } from './types'

export async function searchStocks(
  query: string,
  page: number,
  size = 20,
  signal?: AbortSignal,
): Promise<StockSearchPage> {
  const response = await apiClient.get<StockSearchPage>('/stocks/search', {
    params: { q: query, page, size },
    requiresAuth: true,
    signal,
  })
  return response.data
}
