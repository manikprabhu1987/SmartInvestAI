export interface UserProfile {
  id: number
  name: string
  email: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthSession {
  accessToken: string
  tokenType: 'Bearer'
  expiresAt: string
  user: UserProfile
}

export interface StockSummary {
  symbol: string
  companyName: string
  exchangeCode: string | null
  active: boolean
  quote?: StockQuote | null
}

export interface StockQuote {
  status: 'AVAILABLE' | 'UNAVAILABLE'
  lastPrice: number | null
  currency: string | null
  marketDate: string | null
  source: string
  message: string | null
}

export interface WatchlistEntry {
  id: number
  stock: StockSummary
  addedAt: string
}

export interface WatchlistResponse {
  items: WatchlistEntry[]
}

export interface AddWatchlistStockRequest {
  symbol: string
}

export interface RemoveWatchlistStockResponse {
  symbol: string
  removed: true
}

export interface StockSearchPage {
  items: StockSummary[]
  page: number
  size: number
  hasNext: boolean
}

export interface ApiProblem {
  type?: string
  title?: string
  status?: number
  detail?: string
  code?: string
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}
