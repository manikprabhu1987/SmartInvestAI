# Watchlist Feature Data Model

## Data Ownership

Authentication and watchlist data are stored in MySQL. This plan includes the
existing authentication feature's account lifecycle because the tracked
baseline has no user entity or JWT implementation.

### User (`users`)

An authenticated account that owns watchlist entries.

| Field | Type | Constraints and purpose |
|---|---|---|
| `id` | `BIGINT` | Primary key; generated account identifier |
| `name` | `VARCHAR(255)` | Required display name |
| `email` | `VARCHAR(320)` | Required, unique login identifier; trimmed and normalized to lowercase |
| `password_hash` | `VARCHAR(255)` | Required adaptive one-way password hash (BCrypt per authentication feature) |
| `created_at` | `TIMESTAMP` | Account creation time |

### Revoked Token (`revoked_token`)

The record that prevents a logged-out JWT from being reused before expiry.

| Field | Type | Constraints and purpose |
|---|---|---|
| `token_id` | `VARCHAR(128)` | Primary key; JWT `jti` claim |
| `expires_at` | `TIMESTAMP` | Required expiry time; expired rows can be removed |

## Entities

### Stock Catalog (`stock`)

One supported security available for search and watchlist membership.

| Field | Type | Constraints and purpose |
|---|---|---|
| `symbol` | `VARCHAR(32)` | Primary key; canonical uppercase market symbol |
| `company_name` | `VARCHAR(255)` | Required display name; searchable |
| `exchange_code` | `VARCHAR(32)` | Optional exchange identifier |
| `active` | `BOOLEAN` | Whether the stock can be found and newly added |
| `updated_at` | `TIMESTAMP` | Last catalog update time |

The application database is the selected source of truth for stock existence
and search. Catalog rows are provisioned or updated through an operational
import/seed process; catalog administration endpoints and provider integrations
are outside this feature. Search and new additions include active stocks only.
Existing watchlist entries remain readable if a stock is later deactivated.

### Watchlist Entry (`watchlist_entry`)

One association between an authenticated user and a catalog stock.

| Field | Type | Constraints and purpose |
|---|---|---|
| `id` | `BIGINT` | Primary key; generated entry identifier |
| `user_id` | `BIGINT` | Required foreign key to `users.id` |
| `stock_symbol` | `VARCHAR(32)` | Required foreign key to `stock.symbol` |
| `created_at` | `TIMESTAMP` | Required time the user added the stock |

Required constraints and indexes:

- Unique constraint on (`user_id`, `stock_symbol`) prevents duplicate entries
  for one user, including concurrent add requests.
- Foreign keys reference `users.id` and `stock.symbol`.
- Index on (`user_id`, `created_at`) supports retrieving a user's newest entries
  first.
- The authentication feature owns `users`; no duplicate user table is created
  for watchlist persistence.

## Relationships

- One authentication user has zero or more watchlist entries.
- One stock catalog item has zero or more watchlist entries.
- Each watchlist entry belongs to exactly one user and exactly one stock.
- A user has at most one entry for a given stock.

## Data and Search Semantics

- Symbols are trimmed and canonicalized to uppercase before lookup and storage.
- Symbol comparison is case-insensitive at the API boundary.
- Search matches active stock symbols and company names without regard to case.
- Search is paginated with a default page size of 20 and maximum of 50.
- Registration requires a password of at least 12 characters; no composition
  rules are imposed by this contract.
- Search returns stock summaries only; it does not fetch or persist prices,
  analysis, or recommendations.
- A stock not present as an active catalog row is unknown for search/add
  purposes.

## Transaction and Error Semantics

- Adding an entry is atomic with respect to the unique (`user_id`,
  `stock_symbol`) constraint. A constraint conflict maps to the duplicate
  watchlist error rather than creating a second row.
- Removing an entry deletes only the row owned by the authenticated user.
- JWTs carry the user identity in `sub` and a unique `jti`; the server validates
  the signature and expiry and rejects revoked identifiers.
- Request bodies and paths cannot select another user's watchlist.
- Catalog bootstrap data is required for stock search and add operations to
  return useful results.

## Scope Notes

No watchlist ordering controls, named lists, price snapshots, catalog
administration API, or market-data vendor integration are included.
