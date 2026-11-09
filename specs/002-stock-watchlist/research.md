# Planning Research

## Decisions

### Stock Reference Source

- **Decision**: The MySQL `stock` catalog is the source of truth for stock
  search and symbol validation. The feature does not call a market-data vendor.
- **Rationale**: The user selected a database-managed catalog; the tracked
  baseline contains no market-data provider or stock-symbol source.
- **Alternatives considered**: A provider-neutral external market-data adapter
  was considered but deferred because no provider, exchange coverage, licensing,
  or credentials were specified.
- **Operational consequence**: The catalog must be preloaded or updated by an
  operator-provided import before stock search and add operations are useful.
  Catalog administration endpoints and the import implementation are outside
  this feature's scope.

### Authentication Boundary

- **Decision**: Include registration, login, JWT issuance/validation, and
  logout revocation as foundational work in this plan.
- **Rationale**: The user selected full authentication scope after analysis
  found only form-login security in the tracked application source and no JWT
  or user persistence implementation. Watchlist ownership cannot be enforced
  without an authenticated user identity.
- **Alternatives considered**: Treating the existing authentication feature as
  a completed prerequisite was considered but rejected because its source
  implementation is absent in the tracked baseline.
- **Contract**: The authentication flows follow the existing
  `specs/001-authentication/spec.md` scope; account recovery, refresh tokens,
  and federated identity remain excluded. Logout revokes the JWT identifier
  until its expiry.

### Backend Framework Baseline

- **Decision**: Align the backend build to Java 21 and a supported Spring Boot
  3.x release before feature implementation.
- **Rationale**: The project constitution specifies Spring Boot 3.x, while the
  tracked Maven parent currently declares Spring Boot 4.2.0-SNAPSHOT.
- **Alternatives considered**: Retaining the snapshot was rejected because it
  conflicts with the ratified project technology stack.

### Test Infrastructure

- **Decision**: Use JUnit 5/Mockito unit tests and Spring Boot HTTP integration
  tests against MySQL Testcontainers as the primary integration stack. Use H2
  only as an explicit local fallback when Docker is unavailable.
- **Rationale**: This preserves MySQL-specific persistence coverage while
  retaining a documented fallback for environments where Docker is unavailable.
- **Environment evidence**: Java 21.0.13, Maven 3.9.16, Node.js 26.13.0, and
  Docker Desktop are available. A current `docker info` check confirms the
  Docker Desktop Linux engine is running. The current working tree has deleted
  the tracked backend build and test files, so the existing Maven test
  baseline could not be run without restoring user-deleted files.
- **Browser testing**: Not applicable to this REST-only feature scope; no
  frontend user journey or UI change is specified.

## Unresolved Operational Prerequisite

The stock catalog requires an operator-provided dataset before production
search/add operations can succeed. No provider, exchange coverage, import
format, or initial data set was specified. The feature contract defines the
database catalog shape and records this operational dependency without
inventing a market-data source.
