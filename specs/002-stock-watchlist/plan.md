# Implementation Plan: Stock Watchlist Management

**Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

## Summary

Implement a REST-only stock catalog and personal watchlist on the existing
Java/Spring backend. The plan includes the user-approved registration/login/
logout prerequisite, JWT-protected per-user watchlist operations, a
MySQL-managed stock catalog, deterministic error responses, and test-first
verification. The React starter page is unchanged because no UI behavior was
requested.

## Technical Context

**Language/Version**: Java 21  
**Primary Dependencies**: Spring Boot 3.x, Spring MVC, Spring Data JPA,
Spring Security, OAuth2 Resource Server/JWT support, Bean Validation, Flyway,
MySQL Connector/J; JUnit 5, Mockito, Testcontainers MySQL, and H2 test fallback  
**Storage**: MySQL tables for users, revoked tokens, stock catalog, and
watchlist entries; schema changes managed by Flyway  
**Testing**: JUnit 5/Mockito unit tests; Spring Boot `TestRestTemplate`
integration tests with MySQL Testcontainers; H2 fallback only when Docker is
unavailable  
**Target Platform**: Docker-capable backend and MySQL runtime; API-only feature  
**Performance Goals**: At least 95% of stock searches against a 1,000-stock
catalog complete within two seconds under normal service conditions  
**Constraints**: JWT identity is the sole source of watchlist ownership;
duplicate prevention must be enforced by a database unique constraint; stock
symbols are resolved from preloaded active MySQL catalog rows; no external
market-data provider or frontend UI is in scope. The tracked Maven baseline
declares Spring Boot 4.2.0-SNAPSHOT, which conflicts with the constitution's
Spring Boot 3.x target and must be reconciled in setup.

## Constitution Check

*GATE: Must pass. Re-check after design review.*

| Principle | Result | Plan evidence |
|---|---|---|
| I. Layered Architecture and Clean Design | PASS | Separate controller, service, repository, entity, DTO, and security responsibilities. |
| II. Test-First Quality | PASS | Unit and API tests are written before behavior; JUnit 5 test evidence is required for every implementation task. |
| III. Secure-by-Default | PASS | Register/login are the only public auth routes; protected routes use signed JWTs, ownership comes from the authenticated principal, passwords use BCrypt, and secrets are externalized. |
| IV. Trustworthy Market Data and Analysis | PASS | Stock existence/search use an explicit MySQL catalog; inactive/missing symbols are not silently accepted. No prices or recommendations are introduced. |
| V. Operable, Containerized Delivery | PASS | Backend/MySQL Docker configuration is included with runtime secrets, health checks, and visible startup failures. |

**Baseline constraint**: The current tracked POM declares a Spring Boot 4.2.0
snapshot despite the constitution's 3.x target. Setup aligns the build to a
supported Spring Boot 3.x release rather than silently carrying the mismatch
into the feature.

## Applied Guidelines

- No framework-to-framework migration guideline applies to this feature
  addition. The Spring Boot scaffolding guide is limited to creating a new
  project, while this plan extends an existing backend.
- The plan applies the project constitution and the feature data model/API
  contract directly; it does not introduce a separate application module
  structure.

## Implementation Steps

### Phase 1: Setup

**Purpose**: Align the backend baseline, externalize runtime settings, and
provide a containerized local runtime.

#### Step 1.1: Align backend dependencies and build

- **Requirements**: REQ-009, REQ-012, REQ-014, REQ-016
- **Design inputs**: `tech-stack.md`, `spec.md`, project constitution
- **Description**: Align the Maven parent and starters with Java 21 and a
  supported Spring Boot 3.x release. Add or configure the JWT, Flyway,
  Testcontainers MySQL, and H2 test-fallback dependencies required by later
  phases. Keep JUnit 5/Mockito tests reachable through the canonical Maven
  command.

#### Step 1.2: Configure persistent runtime settings

- **Requirements**: REQ-010, REQ-013, REQ-014, REQ-015
- **Design inputs**: `data-model.md`, `contracts/watchlist-api.yaml`,
  project constitution
- **Description**: Replace committed development credentials with required
  runtime configuration, configure MySQL/Flyway, and externalize JWT signing
  key plus issuer and audience settings. Hibernate must validate the
  migration-managed schema rather than silently changing it.

#### Step 1.3: Add Docker runtime configuration

- **Requirements**: REQ-010
- **Design inputs**: `spec.md`, project constitution
- **Description**: Add a backend Dockerfile and root Compose configuration for
  the API and MySQL. Require credentials and signing keys from environment
  configuration, add database/API health checks, and do not embed stock data
  or secrets in images.

### Phase 2: Foundational Authentication and Persistence

**Purpose**: Establish test infrastructure, schema, authenticated identity,
and consistent API security/error behavior before watchlist stories.

#### Step 2.1: Establish test infrastructure

- **Requirements**: REQ-012, REQ-016
- **Design inputs**: runtime validation strategy below
- **Description**: Configure the MySQL Testcontainers base, H2 fallback
  profile, test database initialization, and shared authentication helpers.

#### Step 2.2: Create persistence schema and authentication model

- **Requirements**: REQ-010, REQ-013, REQ-015
- **Design inputs**: `data-model.md`
- **Description**: Create the initial Flyway migration for `users`,
  `revoked_token`, `stock`, and `watchlist_entry`; implement the User and
  RevokedToken entity/repository layer. Enforce unique normalized email and
  unique (`user_id`, `stock_symbol`) constraints in MySQL.

#### Step 2.3: Implement registration, login, and JWT lifecycle

- **Requirements**: REQ-013, REQ-014, REQ-015, REQ-016
- **Design inputs**: `contracts/watchlist-api.yaml`, authentication feature
  specification, `data-model.md`
- **Description**: Implement registration with BCrypt password hashing, safe
  credential verification, signed expiring JWT issuance with user `sub`,
  unique token `jti`, configured issuer and audience, and logout revocation
  persisted through token expiry.

#### Step 2.4: Secure routes and standardize errors

- **Requirements**: REQ-008, REQ-011, REQ-014, REQ-015
- **Design inputs**: `contracts/watchlist-api.yaml`, project constitution
- **Description**: Replace form-login-only behavior with stateless JWT
  authentication for protected API routes. Permit registration/login, protect
  logout and watchlist routes, validate signature/expiry/issuer/audience/
  revocation, derive owner identity only from the verified principal, and map
  expected failures to safe `application/problem+json` responses.

### Phase 3: User Story 1 - Add a Stock (Priority: P1)

**Goal**: An authenticated user can add one valid catalog stock to their
watchlist.

**Independent Test**: Register and log in, add an active catalog stock, and
verify that the response contains the canonical symbol and the entry can be
retrieved.

#### Step 3.1: Implement stock and watchlist persistence rules

- **Requirements**: REQ-001, REQ-002, REQ-003, REQ-010, REQ-011
- **Design inputs**: `data-model.md`
- **Description**: Implement Stock and WatchlistEntry entities/repositories and
  service behavior for canonical symbol lookup, active catalog validation,
  per-user ownership, and duplicate handling through the database constraint.

#### Step 3.2: Expose the add-stock API

- **Requirements**: REQ-001, REQ-002, REQ-003, REQ-008, REQ-009, REQ-012
- **Design inputs**: `contracts/watchlist-api.yaml`, `spec.md`
- **Description**: Implement `POST /api/v1/watchlist`, request/response DTOs,
  validation, success status, and distinct invalid-symbol, unknown-stock, and
  duplicate error responses.

### Phase 4: User Story 2 - View and Remove Stocks (Priority: P1)

**Goal**: An authenticated user can view and remove only their own watchlist
entries.

**Independent Test**: Add an entry, retrieve it, remove it, confirm it is
absent, and verify another user cannot view or remove it.

#### Step 4.1: Implement list and remove service behavior

- **Requirements**: REQ-004, REQ-005, REQ-008, REQ-011, REQ-012
- **Design inputs**: `data-model.md`, `spec.md`
- **Description**: Implement owner-scoped retrieval and deletion, stable
  newest-first ordering, empty-list behavior, and not-found handling without
  disclosing another user's records.

#### Step 4.2: Expose view and remove APIs

- **Requirements**: REQ-004, REQ-005, REQ-008, REQ-009, REQ-011, REQ-012
- **Design inputs**: `contracts/watchlist-api.yaml`
- **Description**: Implement `GET /api/v1/watchlist` and
  `DELETE /api/v1/watchlist/{symbol}` with the documented response shapes and
  statuses.

### Phase 5: User Story 3 - Search Stocks (Priority: P2)

**Goal**: An authenticated user can search the active catalog by symbol or
company-name fragment.

**Independent Test**: Search a seeded symbol and company-name fragment, verify
matching results and pagination, then verify blank and unmatched queries.

#### Step 5.1: Implement catalog search behavior

- **Requirements**: REQ-006, REQ-007, REQ-008, REQ-010
- **Design inputs**: `data-model.md`, `spec.md`
- **Description**: Implement case-insensitive search against active catalog
  symbols/company names, validation for blank queries, deterministic ordering,
  and page/size bounds.

#### Step 5.2: Expose the stock search API

- **Requirements**: REQ-006, REQ-007, REQ-008, REQ-009, REQ-012
- **Design inputs**: `contracts/watchlist-api.yaml`
- **Description**: Implement `GET /api/v1/stocks/search` and return the
  documented paginated stock summaries and validation/dependency errors.

### Phase 6: Cross-Cutting Verification

#### Step 6.1: Verify contracts, persistence, and runtime delivery

- **Requirements**: REQ-002, REQ-006, REQ-008, REQ-010, REQ-011, REQ-012,
  REQ-016
- **Design inputs**: all feature artifacts and the runtime validation strategy
- **Description**: Run all unit and API integration tests, validate MySQL
  migration behavior and unique constraints, exercise the Docker runtime when
  Docker is available, and verify search timing against a 1,000-row synthetic
  catalog. Document catalog preloading as an operational prerequisite.

## Project Structure

```text
backend/src/main/java/com/smartinvest/backend/
  config/SecurityConfig.java
  controller/AuthController.java
  controller/StockController.java
  controller/WatchlistController.java
  dto/AddWatchlistStockRequest.java
  dto/AuthTokenResponse.java
  dto/LoginRequest.java
  dto/RegisterRequest.java
  dto/RemoveWatchlistStockResponse.java
  dto/StockSearchPageResponse.java
  dto/StockSummaryResponse.java
  dto/UserProfileResponse.java
  dto/WatchlistEntryResponse.java
  entity/User.java
  entity/RevokedToken.java
  entity/Stock.java
  entity/WatchlistEntry.java
  exception/ApiExceptionHandler.java
  repository/UserRepository.java
  repository/RevokedTokenRepository.java
  repository/StockRepository.java
  repository/WatchlistEntryRepository.java
  security/JwtService.java
  service/AuthService.java
  service/StockCatalogService.java
  service/WatchlistService.java
backend/src/main/resources/
  application.properties
  db/migration/V1__create_auth_stock_watchlist_tables.sql
backend/src/test/java/com/smartinvest/backend/
  support/AbstractMysqlIntegrationTest.java
  controller/AuthApiIntegrationTest.java
  controller/StockSearchApiIntegrationTest.java
  controller/WatchlistApiIntegrationTest.java
  security/JwtServiceTest.java
  service/AuthServiceTest.java
  service/StockCatalogServiceTest.java
  service/WatchlistServiceTest.java
backend/Dockerfile
compose.yaml
specs/002-stock-watchlist/
  spec.md
  data-model.md
  contracts/watchlist-api.yaml
```

## Testing Strategy

- **appType**: API-only for this feature; no frontend UI or browser journey is
  specified.
- **Critical user journeys**:
  1. Register -> log in -> add a seeded stock -> retrieve and verify it.
  2. Reject invalid/unknown and duplicate symbols with the documented errors.
  3. User A adds a stock; User B cannot see/remove it; User A removes it.
  4. Search by symbol/name, verify pagination, empty results, blank-query error,
     and token rejection after logout.
- **primaryValidationStack**: JUnit 5/Mockito unit tests plus Spring Boot
  `TestRestTemplate` integration tests using MySQL Testcontainers.
- **fallbackMatrix**:
  - `infra-tier`: MySQL Testcontainers -> H2 test profile only when the Docker
    daemon is unavailable. Prerequisite: Docker daemon.
  - `browser-tier`: Not applicable; the feature has no UI. Use framework-native
    HTTP tests for all feature journeys.
- **Environment requirements**: Java 21, Maven, MySQL Testcontainers and a
  working Docker daemon for primary integration tests; H2 for the documented
  local fallback. Node.js is available but not required for this API-only
  scope.
- **knownGaps**: H2 does not prove MySQL collation, constraint, migration, or
  pagination behavior. MySQL Testcontainers remains required in CI/release
  runs. Docker Desktop is installed and its engine is currently running. The
  existing baseline test command could not run because its tracked POM and test
  sources are deleted in the current working tree.
- **Test data strategy**: Seed test-owned users and catalog rows in isolated
  test setup; use unique email addresses per test; generate at least 1,000
  deterministic synthetic stock rows for search performance checks; clean up
  entries and revoked tokens after each flow.
- **Acceptance criteria**:
  - Auth flow: registration stores a BCrypt hash; duplicate email is rejected;
    login issues a valid JWT; logout makes the same token unusable.
  - Add flow: active catalog symbol creates exactly one entry; unknown/malformed
    symbols do not persist; repeated/concurrent add returns duplicate conflict.
  - Ownership flow: reads/removals are restricted to the token subject; empty
    lists are successful; missing own entries return the documented not-found
    response.
  - Search flow: symbol/name matches, pagination bounds, empty results, and
    blank-query errors match the OpenAPI contract; 95% of queries against 1,000
    rows complete within two seconds under normal service conditions.
- **Validation review expectations**: Confirm tests were written before
  behavior and failed for assertion reasons; verify MySQL migrations and the
  unique constraint on a real MySQL container; review auth status/error
  responses, token revocation, per-user ownership, and absence of secrets in
  images/logs.
- **External dependency strategy**: MySQL is the only service dependency and
  uses Testcontainers for primary integration testing. H2 is a local fallback
  with the gaps above. Stock catalog rows are test fixtures; no third-party
  provider or mock server is needed.
- **Test base classes**: `AbstractMysqlIntegrationTest` supplies container
  lifecycle, migration setup, database cleanup, and test authentication helpers.
- **Per-module test skeletons**: Backend context/startup smoke test and
  auth/watchlist/search API integration test classes are created before feature
  implementation and filled by their story tasks.
- **Test execution rule**: Every implementation task runs the relevant backend
  JUnit tests and reports pass/fail/skip counts. A failing or unrun required
  test blocks task completion.
- **Legacy Test Assets**: One JUnit Spring context-load test,
  `BackendApplicationTests.contextLoads`, was discovered in the committed
  baseline. No legacy E2E suite was found. The file is deleted in the current
  working tree, so it was not run and must not be restored implicitly.

## Task Breakdown

### Phase 1: Setup

- [ ] T001 [Plan:1.1] Align `backend/pom.xml` with Java 21 and a supported Spring Boot 3.x release; configure compatible web, security/JWT, JPA, validation, MySQL, Flyway, JUnit 5, Mockito, Testcontainers MySQL, and H2 test dependencies.
- [ ] T002 [P] [Plan:1.2] Configure `backend/src/main/resources/application.properties` to require runtime MySQL credentials and JWT signing, issuer, and audience configuration; enable Flyway and schema validation without embedded secrets.
- [ ] T003 [Plan:1.3] Add a multi-stage non-root `backend/Dockerfile`, `backend/.dockerignore`, and root `compose.yaml` for the backend and MySQL, with required environment variables, health checks, and no embedded secrets.

### Phase 2: Foundational Authentication and Persistence

- [ ] T004 [Plan:2.1] Create `backend/src/test/java/com/smartinvest/backend/support/AbstractMysqlIntegrationTest.java` with MySQL Testcontainers lifecycle, dynamic datasource configuration, migration setup, cleanup, and an H2-only fallback profile.
- [ ] T005 [P] [Plan:2.3] Write `backend/src/test/java/com/smartinvest/backend/service/AuthServiceTest.java` for registration, normalized unique email, BCrypt hashing, generic invalid-credential errors, and logout revocation; verify behavior assertions fail before implementation.
- [ ] T006 [P] [Plan:2.3] Write `backend/src/test/java/com/smartinvest/backend/security/JwtServiceTest.java` for signature, subject/JTI, issuer/audience, expiry, and revoked-token validation; verify behavior assertions fail before implementation.
- [ ] T007 [Plan:2.3] Write `backend/src/test/java/com/smartinvest/backend/controller/AuthApiIntegrationTest.java` for register -> login -> protected request -> logout -> rejected token.
- [ ] T008 [Plan:2.2] Add `backend/src/main/resources/db/migration/V1__create_auth_stock_watchlist_tables.sql` with users, revoked tokens, stock catalog, watchlist entries, foreign keys, unique email, and unique per-user stock constraints.
- [ ] T009 [Plan:2.2] Implement `User.java`, `RevokedToken.java`, `UserRepository.java`, and `RevokedTokenRepository.java` under `backend/src/main/java/com/smartinvest/backend/` to match `data-model.md`.
- [ ] T010 [Plan:2.3] Implement `AuthService.java` and `JwtService.java` under `backend/src/main/java/com/smartinvest/backend/service/` and `security/` for account creation, credential verification, token issuance, and revocation.
- [ ] T011 [Plan:2.3] Add `RegisterRequest.java`, `LoginRequest.java`, `UserProfileResponse.java`, and `AuthTokenResponse.java` under `backend/src/main/java/com/smartinvest/backend/dto/`, plus `backend/src/main/java/com/smartinvest/backend/controller/AuthController.java` for the documented auth routes.
- [ ] T012 [Plan:2.4] Update `backend/src/main/java/com/smartinvest/backend/config/SecurityConfig.java` to permit register/login, authenticate logout and other API routes with JWT, validate signature/expiry/issuer/audience/revocation, and derive user identity from the verified principal.
- [ ] T013 [Plan:2.4] Add `backend/src/main/java/com/smartinvest/backend/exception/ApiExceptionHandler.java` to map validation, duplicate-email, invalid-credential, revoked-token, and dependency failures to safe Problem Details responses.

### Phase 3: User Story 1 - Add a Stock

- [ ] T014 [P] [US1] [Plan:3.1] Write `backend/src/test/java/com/smartinvest/backend/service/StockCatalogServiceTest.java` for canonical symbols, active/unknown stocks, case-insensitive search inputs, and unavailable catalog errors.
- [ ] T015 [P] [US1] [Plan:3.1] Write `backend/src/test/java/com/smartinvest/backend/service/WatchlistServiceTest.java` for add success, owner identity, duplicate symbols, and database uniqueness conflict mapping.
- [ ] T016 [US1] [Plan:3.2] Write `backend/src/test/java/com/smartinvest/backend/controller/WatchlistApiIntegrationTest.java` cases for add success, malformed/unknown symbol, duplicate response, and persisted read-back.
- [ ] T017 [US1] [Plan:3.1] Implement `Stock.java`, `WatchlistEntry.java`, `StockRepository.java`, and `WatchlistEntryRepository.java` in the backend entity/repository packages, including the owner-scoped lookup and unique-constraint behavior.
- [ ] T018 [US1] [Plan:3.1] Implement `StockCatalogService.java` and `WatchlistService.java` for active catalog validation, symbol normalization, and atomic owner-scoped add behavior.
- [ ] T019 [US1] [Plan:3.2] Add `AddWatchlistStockRequest.java`, `StockSummaryResponse.java`, and `WatchlistEntryResponse.java` under `backend/src/main/java/com/smartinvest/backend/dto/`, plus `backend/src/main/java/com/smartinvest/backend/controller/WatchlistController.java` with documented `POST /api/v1/watchlist` responses.

### Phase 4: User Story 2 - View and Remove Stocks

- [ ] T020 [P] [US2] [Plan:4.1] Write `backend/src/test/java/com/smartinvest/backend/service/WatchlistQueryServiceTest.java` for empty/populated lists, newest-first order, owner isolation, successful removal, and missing-entry behavior.
- [ ] T021 [US2] [Plan:4.2] Extend `backend/src/test/java/com/smartinvest/backend/controller/WatchlistApiIntegrationTest.java` with cross-user visibility/removal checks and add -> view -> remove -> verify-absent flow.
- [ ] T022 [US2] [Plan:4.1] Implement owner-scoped list and delete operations in `WatchlistEntryRepository.java` and `WatchlistService.java`; return not-found without disclosing other users' entries.
- [ ] T023 [US2] [Plan:4.2] Extend `backend/src/main/java/com/smartinvest/backend/controller/WatchlistController.java` with `GET /api/v1/watchlist` and `DELETE /api/v1/watchlist/{symbol}` and add `RemoveWatchlistStockResponse.java` under `backend/src/main/java/com/smartinvest/backend/dto/`.

### Phase 5: User Story 3 - Search Stocks

- [ ] T024 [US3] [Plan:5.1] Extend `backend/src/test/java/com/smartinvest/backend/service/StockCatalogServiceTest.java` with matching, blank-query rejection, page/size bounds, inactive-stock exclusion, and deterministic ordering.
- [ ] T025 [US3] [Plan:5.2] Add `backend/src/test/java/com/smartinvest/backend/controller/StockSearchApiIntegrationTest.java` for symbol/name search, empty matches, blank query, pagination, and 1,000-row search timing.
- [ ] T026 [US3] [Plan:5.1] Implement paginated case-insensitive catalog queries in `StockRepository.java` and `StockCatalogService.java`, enforcing the OpenAPI page and size limits.
- [ ] T027 [US3] [Plan:5.2] Add `StockSearchPageResponse.java` under `backend/src/main/java/com/smartinvest/backend/dto/` and `backend/src/main/java/com/smartinvest/backend/controller/StockController.java` with `GET /api/v1/stocks/search`.

### Phase 6: Cross-Cutting Verification

- [ ] T028 [Plan:6.1] Run `.\backend\mvnw.cmd -f backend\pom.xml clean verify` from the repository root; report unit, integration, and skipped test counts and confirm test-first red/green evidence.
- [ ] T029 [Plan:6.1] Build and start the backend/MySQL stack with `docker compose -f compose.yaml up --build`; verify health checks, migrations, runtime-only secrets, and catalog-preload behavior using the Docker Desktop engine.

## Requirement Mapping

| REQ ID | Description | Plan Items | Implementation Evidence |
|--------|-------------|------------|------------------------|
| REQ-001 | Add a stock to a personal watchlist | 3.1, 3.2 | `WatchlistService.java`, `WatchlistController.java` |
| REQ-002 | Validate supported stock symbols | 3.1, 3.2, 6.1 | `StockCatalogService.java`, `StockRepository.java` |
| REQ-003 | Prevent per-user duplicates, including concurrent requests | 2.2, 3.1, 3.2 | `V1__create_auth_stock_watchlist_tables.sql`, `WatchlistEntryRepository.java`, `WatchlistServiceTest.java` |
| REQ-004 | Retrieve an empty or populated user watchlist | 4.1, 4.2 | `WatchlistService.java`, `WatchlistController.java` |
| REQ-005 | Remove an owned entry and report missing entries | 4.1, 4.2 | `WatchlistService.java`, `WatchlistController.java` |
| REQ-006 | Search stocks by symbol or company name | 5.1, 5.2, 6.1 | `StockRepository.java`, `StockCatalogService.java`, `StockController.java` |
| REQ-007 | Reject blank stock search queries | 5.1, 5.2 | `StockCatalogService.java`, `StockController.java` |
| REQ-008 | Return actionable, non-sensitive errors | 2.4, 3.2, 4.2, 5.2, 6.1 | `ApiExceptionHandler.java`, API integration test classes |
| REQ-009 | Expose REST APIs | 1.1, 3.2, 4.2, 5.2 | `AuthController.java`, `WatchlistController.java`, `StockController.java` |
| REQ-010 | Persist catalog and watchlists in MySQL | 1.2, 1.3, 2.2, 3.1, 6.1 | Flyway migration, JPA repositories, `compose.yaml` |
| REQ-011 | Enforce per-user data ownership | 2.3, 2.4, 3.1, 4.1, 4.2 | `JwtService.java`, `SecurityConfig.java`, owner-scoped repository queries |
| REQ-012 | Unit-test watchlist behaviors | 1.1, 2.1, 3.2, 4.2, 5.2, 6.1 | JUnit service tests and API integration tests |
| REQ-013 | Register users with unique email and adaptive password hashing | 2.2, 2.3 | `User.java`, `UserRepository.java`, `AuthService.java` |
| REQ-014 | Authenticate credentials and issue signed expiring JWTs | 1.1, 2.3, 2.4 | `AuthService.java`, `JwtService.java`, `SecurityConfig.java` |
| REQ-015 | Revoke JWTs on logout | 1.2, 2.2, 2.3, 2.4 | `RevokedToken.java`, `RevokedTokenRepository.java`, logout endpoint |
| REQ-016 | Unit-test authentication and authorization | 1.1, 2.1, 2.3, 6.1 | `AuthServiceTest.java`, `JwtServiceTest.java`, `AuthApiIntegrationTest.java` |
