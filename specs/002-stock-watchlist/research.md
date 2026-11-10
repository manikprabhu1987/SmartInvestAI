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

- **Decision**: Retain the existing Java 21 and Spring Boot 3.5.6 baseline.
- **Rationale**: The inspected tracked Maven parent already matches the
  constitution's Spring Boot 3.x requirement.
- **Alternatives considered**: A framework-version change is unnecessary for
  this feature and was not introduced.

### Test Infrastructure

- **Decision**: Use JUnit 5/Mockito unit tests and Spring Boot HTTP integration
  tests against MySQL Testcontainers as the primary integration stack. Use H2
  only as an explicit local fallback when Docker is unavailable.
- **Rationale**: This preserves MySQL-specific persistence coverage while
  retaining a documented fallback for environments where Docker is unavailable.
- **Environment evidence**: Java 21.0.13, Maven 3.10.0, Node.js 26.13.0, and
  Docker Desktop are available. `docker info` confirms the Docker Desktop
  Linux engine is running. The pre-feature Maven baseline completed
  successfully with zero tests. Testcontainers was pinned to 1.21.4 after the
  prior version attempted to use an obsolete Docker API; the MySQL-backed suite
  then ran successfully.
- **Browser testing**: Not applicable to this REST-only feature scope; no
  frontend user journey or UI change is specified.

## Unresolved Operational Prerequisite

The stock catalog requires an operator-provided dataset before production
search/add operations can succeed. No provider, exchange coverage, import
format, or initial data set was specified. The feature contract defines the
database catalog shape and records this operational dependency without
inventing a market-data source.
