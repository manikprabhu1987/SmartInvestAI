# SmartInvestAI

SmartInvestAI is a stock watchlist application with a React web client and a
Spring Boot REST API. It stores users, the stock catalog, and watchlists in
MySQL. Indian NSE end-of-day quotes can be retrieved through Twelve Data when
an API key and eligible data plan are configured.

## Features

- Register and sign in with email and password; the API issues JWT access
  tokens.
- Search the locally stored stock catalog.
- Add and remove stocks from a personal watchlist. A stock must exist in the
  catalog, and duplicate entries in the same watchlist are rejected.
- Display NSE end-of-day quotes from Twelve Data when available. Quotes are
  cached briefly; unavailable quotes are reported instead of being replaced
  with sample prices.

This repository currently implements authentication, stock search, and
watchlists. It does not yet implement portfolio tracking, technical or
fundamental analysis, or investment recommendations.

## Technology

- Backend: Java 21, Spring Boot 3, Spring Data JPA, Spring Security, JWT
- Frontend: React, TypeScript, Vite, Material UI
- Database: MySQL 8.4 with Flyway migrations
- Runtime: Docker Compose

## Prerequisites

For the recommended Docker setup, install:

- Docker Desktop with Docker Compose
- Git, if cloning the repository

For running the frontend outside Docker, install Node.js 22.12 or later and
npm. For running the backend outside Docker, install Java 21; the included
Maven wrapper downloads and runs the required Maven version.

## Configure the application

Run these commands from the repository root (the directory containing
`compose.yaml`):

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Set the following in `.env` before starting the application:

| Variable | Purpose |
| --- | --- |
| `DB_NAME` | MySQL database name; defaults to `smartinvest`. |
| `DB_USERNAME` | Backend database login; the example uses `root` for local development. |
| `DB_PASSWORD` | Password the backend uses to connect to MySQL. |
| `MYSQL_ROOT_PASSWORD` | Password assigned to the MySQL root account. If using `root` as `DB_USERNAME`, set this to the same value as `DB_PASSWORD`. |
| `JWT_SECRET` | Base64-encoded random secret with at least 32 bytes of key material. Generate one using the command below. |
| `JWT_ISSUER` / `JWT_AUDIENCE` | JWT issuer and audience; the example values work for local development. |
| `JWT_EXPIRATION_MINUTES` | Token lifetime in minutes; defaults to 15. |
| `TWELVE_DATA_API_KEY` | Optional Twelve Data key. NSE quotes require an eligible plan and are end-of-day, not real-time. |
| `MYSQL_PORT` / `SERVER_PORT` / `FRONTEND_PORT` | Optional host ports; defaults are `3306`, `8080`, and `4173`. |

Generate a JWT secret in PowerShell and copy its output into `JWT_SECRET` in
`.env`:

```powershell
$bytes = New-Object byte[] 32
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
$rng.Dispose()
```

Keep `.env` private. It is ignored by Git; do not paste credentials or API
keys into source files, commit them, or share them in chat. `.env.example`
contains placeholders only. The Compose file uses MySQL `root` for convenient
local development; use a restricted database account outside local
development.

## Run with Docker Compose (recommended)

From the repository root, after configuring `.env`:

```powershell
docker compose up --build -d
docker compose ps
```

Open the frontend at `http://localhost:4173` (or the configured
`FRONTEND_PORT`). The backend is available at `http://localhost:8080` (or
`SERVER_PORT`), and MySQL is available locally at `localhost:3306` (or
`MYSQL_PORT`).

Check service health and startup logs:

```powershell
curl.exe --fail http://localhost:8080/actuator/health
docker compose logs --tail 100 backend
```

The health endpoint should return a JSON status of `UP`. If you change
application configuration or source code, rebuild the affected containers:

```powershell
docker compose up --build -d backend frontend
```

To stop the services without deleting the database:

```powershell
docker compose down
```

The database is stored in the Compose volume `mysql_data` and remains available
after `docker compose down`. Avoid `docker compose down -v` unless you
intentionally want to permanently delete the local database contents.

## Run frontend and backend outside Docker (optional)

The simplest development workflow is to keep MySQL in Docker and run the
backend and frontend locally. Configure the required database and JWT
environment variables from `.env` in the shells where the processes run; the
application does not automatically load `.env` outside Docker Compose.

Start MySQL from the repository root:

```powershell
docker compose up -d mysql
```

In a PowerShell window, set the backend's required environment variables
(substitute the values from your local `.env`, without sharing them):

```powershell
$env:DB_URL = "jdbc:mysql://localhost:3306/smartinvest"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "<same password as MYSQL_ROOT_PASSWORD>"
$env:JWT_SECRET = "<your generated base64 secret>"
$env:JWT_ISSUER = "smart-invest-ai"
$env:JWT_AUDIENCE = "smart-invest-client"
$env:JWT_EXPIRATION_MINUTES = "15"
$env:TWELVE_DATA_API_KEY = "<optional Twelve Data key>"
```

Then start the backend from the `backend` directory:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

In a separate PowerShell window, start the frontend from the `frontend`
directory. The default development proxy targets the backend at
`http://localhost:8080`; set `VITE_PROXY_TARGET` if your backend uses another
address.

```powershell
cd frontend
npm ci
npm run dev
```

Vite prints the frontend URL (normally `http://localhost:5173`). Stop either
development server with `Ctrl+C`.

## Use the application

1. Open the frontend and register an account.
2. Sign in with that account.
3. Search the stock catalog and add a stock to your watchlist.
4. View or remove stocks from the watchlist.

The stock search and watchlist use the `stock` table as their catalog. A stock
must already exist there to be added to a watchlist. No market price is
fabricated when a quote is unavailable.

## REST API

The API base path is `/api/v1`. Except for registration, login, and the health
checks, API operations require a valid bearer JWT in the `Authorization`
header.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Register a user. Request fields: `name`, `email`, and `password` (minimum 12 characters). |
| `POST` | `/api/v1/auth/login` | Authenticate and receive an access token. |
| `POST` | `/api/v1/auth/logout` | Revoke the current bearer token. |
| `GET` | `/api/v1/stocks/search?q=TCS&page=0&size=20` | Search the stock catalog; page size is limited to 50. |
| `GET` | `/api/v1/watchlist` | List the authenticated user's watchlist. |
| `POST` | `/api/v1/watchlist` | Add a stock; JSON body example: `{"symbol":"TCS"}`. |
| `DELETE` | `/api/v1/watchlist/{symbol}` | Remove a stock by symbol. |
| `GET` | `/api/health` | Application API health response. |
| `GET` | `/actuator/health` | Spring Boot health response. |

Invalid requests return a problem response with an appropriate HTTP status.
For example, adding a symbol absent from the catalog returns `404`, and adding
a duplicate symbol returns `409`. See the OpenAPI contract at
[`specs/002-stock-watchlist/contracts/watchlist-api.yaml`](./specs/002-stock-watchlist/contracts/watchlist-api.yaml)
for request and response schemas.

### Example API flow in PowerShell

Set `$baseUrl` to the backend host and port. The following example registers
an account, signs in, and uses the returned token to search stocks:

```powershell
$baseUrl = "http://localhost:8080"
$registration = @{
  name = "Example User"
  email = "you@example.com"
  password = "Choose-A-Strong-Password"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/auth/register" `
  -ContentType "application/json" -Body $registration

$credentials = @{
  email = "you@example.com"
  password = "Choose-A-Strong-Password"
} | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/auth/login" `
  -ContentType "application/json" -Body $credentials
$headers = @{ Authorization = "Bearer $($login.accessToken)" }

Invoke-RestMethod -Method Get `
  -Uri "$baseUrl/api/v1/stocks/search?q=TCS&page=0&size=20" `
  -Headers $headers
```

Use your own test email and strong password; do not put production credentials
or tokens into scripts committed to the repository.

## Database

The default database name is `smartinvest`. Flyway applies schema changes
automatically when the backend starts; Hibernate validates the schema but
does not create it. Current application tables are:

- `users` — registered users and password hashes
- `revoked_token` — revoked JWT identifiers
- `stock` — searchable stock catalog and exchange codes
- `watchlist_entry` — user-to-stock watchlist entries
- `flyway_schema_history` — Flyway migration bookkeeping

To inspect the MySQL container:

```powershell
docker compose exec mysql mysql -u root -p smartinvest
```

Enter the `MYSQL_ROOT_PASSWORD` when prompted, then run `SHOW TABLES;` at the
MySQL prompt. For other database names or a different MySQL port, use the
matching values from `.env`.

## Stock quotes

The backend sends quote requests to Twelve Data; the API key stays on the
server. Configure `TWELVE_DATA_API_KEY` in the root `.env` and restart or
recreate the backend after changing it. The implementation currently requests
NSE quotes through Twelve Data's EOD API. This is **end-of-day data, not live
or intraday pricing**, and the provider requires an eligible NSE data plan.
Provider errors (including plan or symbol restrictions) appear as unavailable
quotes in the UI.

Provider documentation: [Twelve Data EOD API](https://twelvedata.com/docs/market-data/end-of-day-price)
and [XNSE availability](https://twelvedata.com/exchanges/xnse).

## Tests and checks

Run backend tests from the `backend` directory:

```powershell
.\mvnw.cmd test
```

Run frontend tests, lint, and production build from the `frontend` directory:

```powershell
npm ci
npm test
npm run lint
npm run build
```

The frontend also defines an end-to-end Playwright test command:

```powershell
npm run test:e2e
```

## Troubleshooting

- **A container is unhealthy:** run `docker compose ps` and
  `docker compose logs --tail 100 <service>` (for example, `backend` or
  `mysql`).
- **Backend cannot connect to MySQL:** ensure MySQL is healthy and `DB_NAME`,
  `DB_USERNAME`, and `DB_PASSWORD` match the configured MySQL database and
  account. For local `root` access, `DB_PASSWORD` must match
  `MYSQL_ROOT_PASSWORD`.
- **Port is already in use:** change `SERVER_PORT`, `FRONTEND_PORT`, or
  `MYSQL_PORT` in `.env`, then recreate the relevant containers.
- **Stock search returns no results:** the stock must be present and active
  in the `stock` catalog table.
- **Quote is unavailable:** confirm an API key is configured and that your
  Twelve Data account has an eligible NSE plan. NSE quotes are EOD.
- **A new database appears empty:** confirm that your MySQL client is
  connecting to the same host port and `DB_NAME` used by Compose. The default
  Compose port is `3306`; a customized `MYSQL_PORT` changes the host port.

## Project layout

```text
backend/
  src/main/java/.../controller/   REST endpoints
  src/main/java/.../service/      Application and provider logic
  src/main/java/.../repository/   Spring Data persistence
  src/main/java/.../entity/       JPA entities
  src/main/java/.../security/     JWT authentication and authorization
  src/main/resources/db/migration/ Flyway schema migrations
frontend/                          React and TypeScript client
specs/                             Requirements, plan, and API contract
compose.yaml                       Local MySQL, backend, and frontend services
```