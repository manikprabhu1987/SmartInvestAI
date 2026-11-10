# SmartInvest AI frontend

## Local development

```powershell
cd frontend
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

The Vite development server proxies `/api/v1` to `http://localhost:8080` by
default. Set `VITE_PROXY_TARGET` to use a different backend address. The
deployed frontend reads `SMARTINVEST_API_ORIGIN` at container startup; leave
it empty to use the same-origin API proxy.

## Docker

From the repository root, copy `.env.example` to `.env`, supply the database
and JWT settings locally, then run `docker compose up --build`. The frontend
is available at `http://localhost:4173` by default. `FRONTEND_PORT` changes
the host port, and `SMARTINVEST_API_ORIGIN` optionally overrides the browser's
API origin. Keep `.env` private; do not commit credentials.

Indian NSE prices use Twelve Data's End-of-Day (EOD) endpoint. Register for a
Twelve Data API key and configure `TWELVE_DATA_API_KEY` in the root `.env`
file. Twelve Data currently lists NSE access under its Grow plan and classifies
NSE data as EOD, not real-time. The backend keeps the API key private and
caches successful quotes briefly to reduce provider requests. Until an
eligible key is configured, or when a symbol cannot be quoted, the UI explains
that the price is unavailable instead of showing sample data.

See Twelve Data's [EOD API documentation](https://twelvedata.com/docs/market-data/end-of-day-price)
and [NSE market availability](https://twelvedata.com/exchanges/xnse).

The sample Compose configuration uses the MySQL `root` account for local
development. Replace it with a restricted application account before using
this stack in a shared or production environment.

The standalone frontend image listens on port `8080`, exposes `/healthz`, and
runs as the unprivileged Nginx user. `API_PROXY_TARGET` defaults to
`http://backend:8080` for Compose networking.
