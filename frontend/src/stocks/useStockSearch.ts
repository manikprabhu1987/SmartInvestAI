import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiError } from '../api/httpClient'
import { searchStocks } from '../api/stockApi'
import type { StockSearchPage } from '../api/types'

const PAGE_SIZE = 20

export function useStockSearch() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [searchVersion, setSearchVersion] = useState(0)
  const [results, setResults] = useState<StockSearchPage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef(0)

  useEffect(() => {
    if (!query) return
    const controller = new AbortController()
    const currentRequestId = ++requestId.current
    setLoading(true)
    setError('')

    void searchStocks(query, page, PAGE_SIZE, controller.signal)
      .then((response) => {
        if (requestId.current === currentRequestId) setResults(response)
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted && requestId.current === currentRequestId) {
          setResults(null)
          setError(getApiError(reason).message)
        }
      })
      .finally(() => {
        if (requestId.current === currentRequestId) setLoading(false)
      })

    return () => controller.abort()
  }, [page, query, searchVersion])

  const search = useCallback((value: string) => {
    const normalizedQuery = value.trim()
    setResults(null)
    setPage(0)
    if (!normalizedQuery) {
      setQuery('')
      setError('Enter a symbol or company name to search.')
      setLoading(false)
      return
    }
    setError('')
    setQuery(normalizedQuery)
    setSearchVersion((version) => version + 1)
  }, [])

  const goToPage = useCallback(
    (nextPage: number) => {
      if (nextPage < 0 || !query) return
      if (results && nextPage > page && !results.hasNext) return
      setPage(nextPage)
    },
    [page, query, results],
  )

  return { query, page, results, loading, error, search, goToPage }
}
