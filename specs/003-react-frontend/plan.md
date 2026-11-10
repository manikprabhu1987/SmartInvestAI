# Implementation Plan: SmartInvest AI React Frontend

**Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

## Summary

Turn the existing React/Vite starter into a responsive SmartInvest AI frontend
for authentication, personal watchlists, and paginated stock search. Keep
presentation and domain view logic separate from a typed Axios API boundary,
consume the existing Spring Boot `/api/v1` contract, protect user-owned flows
with the session's JWT, and provide Material UI light/dark themes. Add Vitest
and React Testing Library coverage plus Playwright browser journeys. Package
the SPA as a non-root Docker image whose backend API origin is supplied at
container runtime.

## Technical Context

**Language/Version**: TypeScript, React 19, Node.js (LTS-compatible runtime)  
**Primary Dependencies**: Vite, Axios, React Router, Material UI, Vitest,
React Testing Library, and Playwright for browser journeys  
**Storage**: No frontend-owned persistent business data. Keep the JWT in
`sessionStorage` for the active tab session; persist only the theme preference
locally. All account, stock, and watchlist data remains authoritative in the
existing backend.  
**Testing**: Vitest/React Testing Library for unit and component behavior;
Playwright for browser-level workflows against the Vite app, with deterministic
backend API stubs. Validate the Docker-served build and runtime configuration.  
**Target Platform**: Responsive web SPA on current desktop and mobile browsers;
non-root Docker image serving the production build.  
**Performance Goals**: Meet the spec's user-facing response goals: display
successful search/watchlist results within two seconds after the API responds
for at least 95% of measured interactions; preserve responsive operation from
320 to 1920 CSS pixels.  
**Constraints**: Existing backend contract is authoritative; API paths and
payloads must not be changed by this frontend plan. Runtime configuration must
not bake a backend origin into the image. Never persist passwords or forward
JWTs to unrelated origins. Registration does not create an authenticated
session; login is a separate step. The search catalog may be empty until
operationally seeded.

## Constitution Check

*GATE: Must pass. Re-check after design review.*

| Principle | Result | Plan evidence |
|---|---|---|
| I. Layered Architecture and Clean Design | PASS | Separate API client/contracts, session/domain state, route/page composition, and reusable presentation; components do not own transport logic. |
| II. Test-First Quality | PASS | Add Vitest/RTL tests before behavior and use Playwright for the critical SPA flows; tests run through the canonical frontend scripts. |
| III. Secure-by-Default | PASS | Store only the short-lived access token in session storage, constrain bearer headers to the configured API origin, clear invalid sessions, and avoid logging credentials or tokens. |
| IV. Trustworthy Market Data and Analysis | PASS | Display catalog identity returned by the backend without synthesizing prices, freshness, analysis, or recommendations. |
| V. Operable, Containerized Delivery | PASS | Build a non-root Docker image with runtime API-origin configuration, health/readiness behavior, and visible startup/configuration failures. |

## Applied Guidelines

- No React/Vite-specific migration guideline is present in `skills/guidelines/`.
  The available Struts-to-Spring and Spring Boot scaffolding guidance does not
  apply to this frontend feature.
- Follow the constitution's frontend boundary: presentation, API communication,
  and domain-specific view logic remain separated.
- Follow the frontend feature spec and the existing
  `specs/002-stock-watchlist/contracts/watchlist-api.yaml` contract. Do not
  introduce a second API shape or backend behavior.

## Implementation Steps

### Phase 1: Setup

**Purpose**: Establish the frontend dependency, test, and configuration
foundations while preserving the existing Vite project conventions.

#### Step 1.1: Align the frontend scaffold and quality scripts

- **Requirements**: REQ-014, REQ-017, REQ-018
- **Design inputs**: `spec.md`, `.github/modernize/rearchitecture/artifacts/project-structure.md`, `.github/modernize/rearchitecture/artifacts/tech-stack.md`
- **Description**: Confirm the existing frontend location and Vite entry point;
  add or align React 19, TypeScript, Vite, Axios, React Router, Material UI,
  Vitest, React Testing Library, and their required test environment. Provide
  canonical `dev`, `build`, `test`, and `preview` scripts and keep the lockfile
  synchronized. Add a minimal app-render/startup test so the scaffold is
  verifiable before feature work.

#### Step 1.2: Add runtime API-origin configuration and shared API contracts

- **Requirements**: REQ-004, REQ-013, REQ-018
- **Design inputs**: `spec.md` Integration Contract, `contracts/watchlist-api.yaml`
- **Description**: Define a typed frontend API configuration contract that
  reads the API origin at runtime, validates it, and appends `/api/v1` exactly
  once. Define TypeScript request/response/problem types from the backend
  contract. Avoid compile-time-only Vite environment values for the deployed
  origin.

### Phase 2: Foundational API and Session Infrastructure

**Purpose**: Provide a single safe API boundary and authenticated application
shell for the independent user-story phases.

#### Step 2.1: Implement the HTTP client and request behavior

- **Requirements**: REQ-004, REQ-006, REQ-013
- **Design inputs**: `spec.md` Integration Contract, `contracts/watchlist-api.yaml`
- **Description**: Create a shared Axios client, typed endpoint methods,
  consistent Problem Details extraction, bearer-token attachment limited to
  the configured backend origin, and centralized unauthorized-session
  handling. Add focused tests for URL composition, headers, error mapping, and
  401 behavior.

#### Step 2.2: Establish accessible application shell and route boundaries

- **Requirements**: REQ-007, REQ-014
- **Design inputs**: `spec.md` User Scenarios, project constitution
- **Description**: Replace the static starter view with an application shell,
  navigation landmarks, loading/error boundaries, and protected route
  behavior. Keep the shell's route composition separate from the API client
  and feature pages.

### Phase 3: User Story 1 - Register and Access an Account (Priority: P1)

**Goal**: A visitor can register, sign in, access authenticated pages, and
revoke their session at logout.

**Independent Test**: Complete registration, sign in with the created account,
reach a protected page, then log out and confirm protected content is blocked.

#### Step 3.1: Implement registration and login forms

- **Requirements**: REQ-001, REQ-002, REQ-013, REQ-017
- **Design inputs**: `spec.md` Authentication scenarios, backend auth schemas
- **Description**: Add accessible registration/login forms, client-side
  required-field and email validation, pending/error states, and backend error
  messaging. Registration success directs the user to login without pretending
  they are authenticated.

#### Step 3.2: Implement browser-session authentication and logout

- **Requirements**: REQ-003, REQ-005, REQ-006, REQ-007, REQ-017
- **Design inputs**: `spec.md` token-storage assumptions and API contract
- **Description**: Add typed session state backed by `sessionStorage`, login
  token expiry handling, protected route redirects, logout revocation, and
  local token clearing even when the revocation request fails. Do not persist
  passwords or use the cleared token on subsequent requests.

### Phase 4: User Story 2 - Manage a Personal Watchlist (Priority: P1)

**Goal**: An authenticated user can view, add, and remove their backend-owned
watchlist entries.

**Independent Test**: Load an empty list, add a known stock, verify it appears
only after success, remove it, and verify it is absent.

#### Step 4.1: Implement watchlist data access and view state

- **Requirements**: REQ-008, REQ-009, REQ-010, REQ-013, REQ-017
- **Design inputs**: `spec.md` watchlist scenarios, `contracts/watchlist-api.yaml`
- **Description**: Implement typed list/add/remove calls and feature state for
  loading, empty, success, and API error outcomes. Mutations update the view
  only after a successful backend response.

#### Step 4.2: Build watchlist screens and add/remove interactions

- **Requirements**: REQ-008, REQ-009, REQ-010, REQ-013, REQ-014, REQ-017
- **Design inputs**: `spec.md` watchlist scenarios and responsive UI requirements
- **Description**: Render identifying stock information, explicit empty and
  loading states, add-by-symbol input, duplicate/unknown validation errors,
  and a confirmed removal action. Reuse the same add behavior from search
  results.

### Phase 5: User Story 3 - Search and Select Stocks (Priority: P1)

**Goal**: An authenticated user can find supported stocks, navigate result
pages, and add a result to their watchlist.

**Independent Test**: Search by symbol and company name, navigate forward and
back, verify empty and invalid queries, and add a result.

#### Step 5.1: Implement stock search requests and pagination state

- **Requirements**: REQ-011, REQ-012, REQ-013, REQ-017
- **Design inputs**: `spec.md` Search scenarios, `contracts/watchlist-api.yaml`
- **Description**: Implement query validation, typed search calls with
  zero-based page and bounded page size, latest-request state handling, and
  navigation using the backend's `page`, `size`, and `hasNext` response.

#### Step 5.2: Build search results and add-from-search experience

- **Requirements**: REQ-009, REQ-011, REQ-012, REQ-013, REQ-014, REQ-017
- **Design inputs**: `spec.md` Search scenarios and Integration Contract
- **Description**: Add a search page with symbol/company-name input, result
  summaries, empty/loading/error states, previous/next controls, and add-stock
  actions that submit the canonical returned symbol and reflect only confirmed
  outcomes.

### Phase 6: User Story 4 - Use the App Across Devices and Themes (Priority: P2)

**Goal**: All screens remain usable across supported viewport sizes and have
consistent light/dark appearances.

**Independent Test**: Check registration, login, search, and watchlist at
mobile/tablet/desktop widths, toggle themes, navigate, and reload.

#### Step 6.1: Implement theme selection and persistence

- **Requirements**: REQ-015, REQ-016, REQ-017
- **Design inputs**: `spec.md` theme scenarios
- **Description**: Configure the Material UI theme provider for light and dark
  modes, load saved preference before first render, otherwise use the device
  preference, and persist the user's explicit selection.

#### Step 6.2: Complete responsive and accessible presentation

- **Requirements**: REQ-014, REQ-015, REQ-017
- **Design inputs**: `spec.md` responsive and accessibility scenarios
- **Description**: Apply responsive layouts and keyboard/focus/label/status
  behavior to auth, search, navigation, and watchlist screens; verify no
  unintended horizontal scrolling from 320 to 1920 CSS pixels.

### Phase 7: Cross-Cutting Docker and Runtime Verification

#### Step 7.1: Add runtime-configurable non-root Docker delivery

- **Requirements**: REQ-018
- **Design inputs**: `spec.md` deployment and runtime API-origin requirements,
  project constitution
- **Description**: Add a multi-stage frontend Dockerfile and supporting server
  configuration. Serve the production Vite build with a non-root process,
  provide the API origin via a validated runtime config file rather than
  baking it into the image, add an actionable health route, and exclude
  credentials and local dependency/build artifacts from the image context.

#### Step 7.2: Verify browser journeys, responsive behavior, and delivery

- **Requirements**: REQ-001 through REQ-018
- **Design inputs**: all feature requirements and Testing Strategy below
- **Description**: Run canonical frontend tests and build, execute Playwright
  multi-step auth/watchlist/search journeys, verify responsive breakpoints and
  theme persistence, build/start the Docker image with runtime API
  configuration, and record pass/fail/skip counts and any limitations.

## Project Structure

```text
frontend/
  Dockerfile
  .dockerignore
  docker/
    nginx.conf.template
    container-entrypoint.sh
  public/
    runtime-config.js
  package.json
  playwright.config.ts
  vite.config.ts
  src/
    main.tsx
    App.tsx
    app/
      AppRouter.tsx
      AppShell.tsx
      ProtectedRoute.tsx
    api/
      apiConfig.ts
      httpClient.ts
      authApi.ts
      stockApi.ts
      watchlistApi.ts
      types.ts
    auth/
      AuthProvider.tsx
      sessionStorage.ts
      LoginPage.tsx
      RegisterPage.tsx
    stocks/
      StockSearchPage.tsx
      SearchResults.tsx
    watchlist/
      WatchlistPage.tsx
      AddStockForm.tsx
    theme/
      ThemeProvider.tsx
      themePreference.ts
    shared/
      ApiError.ts
      LoadingState.tsx
      ErrorMessage.tsx
  tests/
    e2e/
```

## Testing Strategy

- **appType**: SPA.
- **Critical user journeys**:
  1. Register -> submit valid details -> see confirmation -> log in -> access
     protected pages.
  2. Log in -> load watchlist -> add supported symbol -> verify success and
     read-back -> remove -> verify absence.
  3. Search by symbol and company name -> move across pages -> add a result.
  4. Submit invalid credentials or encounter a protected API 401 -> see a safe
     message and verify local session/route protection.
  5. Toggle theme -> navigate across auth and data screens -> reload and
     restore preference at mobile, tablet, and desktop sizes.
- **primaryValidationStack**: Vitest + React Testing Library for unit and
  component behavior; Playwright for browser journeys against the production
  Vite build; Docker-built frontend image for runtime configuration and health
  verification.
- **fallbackMatrix**:
  - `infra-tier`: Docker-built frontend and isolated API stubs; no database is
    required for frontend UI tests. Where a live backend is used, run its
    existing Spring Boot integration profile with MySQL Testcontainers and
    provision deterministic catalog test rows. If Docker is unavailable, run
    frontend tests and Vite-hosted Playwright independently; report Docker
    delivery as unverified. Prerequisite: Docker daemon.
  - `browser-tier`: Playwright against the production build is required for
    this SPA; Vitest/RTL may supplement but do not replace browser tests.
    Prerequisite: Node.js and installable Playwright Chromium.
- **Environment requirements**: Node.js compatible with React 19/Vite,
  npm-compatible lockfile, Docker Desktop/Engine for image verification,
  Playwright Chromium for browser journeys, and a backend API origin for
  optional live smoke checks.
- **knownGaps**: Stubbing API responses in browser tests verifies client
  contract usage and UI behavior but does not prove a deployed backend is
  reachable. Docker-unavailable runs cannot verify image construction,
  container health, or runtime injection. A live search/add smoke test requires
  active catalog seed rows; no production catalog provider is in scope.
- **Test data strategy**: Use deterministic API fixtures for users, stock
  summaries, watchlist entries, pages, and `application/problem+json` errors.
  Give generated account identifiers unique values per test, clear session and
  local storage between browser contexts, and stub backend requests by method,
  URL, authorization header, response body, and status. Do not depend on
  production data.
- **Acceptance criteria**:
  - Vitest/RTL covers registration/login validation, token storage/clearing,
    protected routing, bearer scoping, errors, watchlist mutation confirmation,
    pagination, and theme selection/persistence.
  - Playwright covers at least the five critical user journeys as multi-step
    flows and verifies visible outcomes and route/session behavior.
  - Responsive checks exercise 320, 768, and 1920 CSS-pixel viewport widths;
    no horizontal document overflow is allowed.
  - Docker verification proves the non-root image starts, serves the SPA and
    health route, and reads the backend origin from runtime configuration
    without requiring a rebuild.
  - The canonical `npm test` and `npm run build` commands exit zero, and all
    tests report pass/fail/skip counts.
- **Validation review expectations**: Confirm tests cover every REQ-XXX, no
  password/JWT is logged or persisted outside session storage, auth headers
  are restricted to the configured backend origin, error and empty states do
  not appear as success, all navigation works at supported viewport sizes, and
  the runtime-configured Docker image contains no credentials.
- **External dependency strategy**:
  - Spring Boot REST API: use typed Axios methods and deterministic HTTP
    stubs in Vitest and Playwright; optionally run a live smoke check against
    the existing API using its published contract and a preloaded test catalog.
    Do not make component/unit tests depend on an unavailable backend.
  - MySQL: not accessed by the frontend directly. Any live backend test uses
    the backend's existing MySQL Testcontainers strategy rather than adding a
    second frontend database.
  - Browser: Playwright-managed Chromium, headless in CI.
- **Test base classes**: Shared Vitest setup resets storage, theme media-query
  state, and HTTP stubs between tests; shared Playwright fixtures create a new
  browser context with cleared storage and deterministic API routes.
- **Per-module test skeletons**: Add a Vite application-render smoke test,
  API-client contract tests, authentication/session tests, watchlist component
  tests, search/pagination tests, theme tests, and Playwright E2E project
  before their corresponding behavior is implemented.
- **Test execution rule**: Each implementation task runs the narrowest
  relevant test selector, and every task runs `npm test` where feasible. The
  final task runs the canonical full test suite, build, Playwright journeys,
  and Docker validation; failing required tests block completion.
- **Legacy Test Assets**: No frontend E2E test inventory or user-supplied test
  files were provided in the artifacts; add new Playwright tests for the
  journeys above.

## Task Breakdown

### Phase 1: Setup

- [x] T001 [Plan:1.1] Inspect `frontend/package.json`, lockfile, and Vite scripts; add or align React 19, TypeScript, Axios, React Router, Material UI, Vitest, React Testing Library, and Playwright dependencies and canonical scripts.
- [x] T002 [P] [Plan:1.1] Add `frontend/src/test/setup.ts` and a minimal render smoke test in `frontend/src/App.test.tsx`; configure Vitest and Testing Library in `frontend/vite.config.ts`.
- [x] T003 [Plan:1.2] Define `frontend/src/api/types.ts` with auth, stock, watchlist, paginated response, and backend Problem Details types matching the API contract.
- [x] T004 [Plan:1.2] Implement and unit-test runtime API origin parsing in `frontend/src/api/apiConfig.ts`; validate configuration and normalize the `/api/v1` prefix.

### Phase 2: Foundational API and Session Infrastructure

- [x] T005 [P] [Plan:2.1] Add `frontend/src/api/httpClient.test.ts` for API URL composition, bearer-header origin restriction, safe problem extraction, and 401 handling before client implementation.
- [x] T006 [Plan:2.1] Implement `frontend/src/api/httpClient.ts` and typed `authApi.ts`, `stockApi.ts`, and `watchlistApi.ts` methods matching the documented HTTP routes and response shapes.
- [x] T007 [Plan:2.2] Create the shared Material UI app shell and semantic navigation in `frontend/src/app/AppShell.tsx`, preserving the existing application entry points [Source: frontend/src/App.tsx] [Source: frontend/src/main.tsx].
- [x] T008 [P] [Plan:2.2] Add `frontend/src/app/ProtectedRoute.test.tsx` covering anonymous redirect, authenticated access, and return-to-login behavior.

### Phase 3: User Story 1 - Register and Access an Account

- [x] T009 [P] [US1] [Plan:3.1] Add registration validation, success, pending, and backend-error tests in `frontend/src/auth/RegisterPage.test.tsx`.
- [x] T010 [US1] [Plan:3.1] Implement accessible registration UI in `frontend/src/auth/RegisterPage.tsx`; submit the documented registration payload and route to login without creating a local session.
- [x] T011 [P] [US1] [Plan:3.2] Add session/auth tests in `frontend/src/auth/AuthProvider.test.tsx` for token storage, expiry, logout revocation, request failure, local clearing, and stale-session handling.
- [x] T012 [US1] [Plan:3.2] Implement `frontend/src/auth/sessionStorage.ts` and `frontend/src/auth/AuthProvider.tsx` with session-only JWT storage, expiry checks, logout, and unauthorized-session cleanup.
- [x] T013 [US1] [Plan:2.2,3.1,3.2] Implement `frontend/src/auth/LoginPage.tsx` and `frontend/src/app/AppRouter.tsx`; wire register/login routes, authenticated shell routes, and protected navigation [Source: frontend/src/App.tsx].
- [x] T014 [US1] [Plan:3.1,3.2] Add `frontend/tests/e2e/auth.spec.ts` Playwright journeys for registration -> login -> protected page and invalid credentials -> safe error.

### Phase 4: User Story 2 - Manage a Personal Watchlist

- [x] T015 [P] [US2] [Plan:4.1] Add watchlist API/state tests in `frontend/src/watchlist/useWatchlist.test.tsx` for loading, empty results, successful read-back, errors, and confirmed-only mutations.
- [x] T016 [US2] [Plan:4.1] Implement typed watchlist data access and state in `frontend/src/watchlist/useWatchlist.ts` using the shared API client.
- [x] T017 [US2] [Plan:4.2] Implement `frontend/src/watchlist/WatchlistPage.tsx` and `frontend/src/watchlist/AddStockForm.tsx` with stock summaries, empty/loading states, add validation, and actionable errors.
- [x] T018 [US2] [Plan:4.2] Add confirmed removal UX and component coverage in `frontend/src/watchlist/WatchlistPage.test.tsx`; preserve entries on failed or not-found removal.
- [x] T019 [US2] [Plan:4.2] Add `frontend/tests/e2e/watchlist.spec.ts` for authenticated empty list -> add -> read-back -> remove -> absent flow and API failure handling.

### Phase 5: User Story 3 - Search and Select Stocks

- [x] T020 [P] [US3] [Plan:5.1] Add `frontend/src/stocks/useStockSearch.test.tsx` for query validation, zero-based pages, bounded size, `hasNext`, stale responses, empty pages, and errors.
- [x] T021 [US3] [Plan:5.1] Implement `frontend/src/stocks/useStockSearch.ts` with typed query/pagination state and safe handling of overlapping requests.
- [x] T022 [US3] [Plan:5.2] Implement `frontend/src/stocks/StockSearchPage.tsx` and `frontend/src/stocks/SearchResults.tsx` with symbol/name search, empty/error/loading states, and previous/next controls.
- [x] T023 [US3] [Plan:5.2,4.2] Connect search-result add actions to the shared watchlist operation and add page-navigation/add/error coverage in `frontend/src/stocks/StockSearchPage.test.tsx`.
- [x] T024 [US3] [Plan:5.2] Extend `frontend/tests/e2e/watchlist.spec.ts` with symbol/name search, pagination, empty results, and add-from-search browser coverage.

### Phase 6: User Story 4 - Responsive Layout and Themes

- [x] T025 [P] [US4] [Plan:6.1] Add `frontend/src/theme/ThemeProvider.test.tsx` for saved preference, system preference fallback, explicit switching, and persistence.
- [x] T026 [US4] [Plan:6.1] Implement `frontend/src/theme/themePreference.ts` and `frontend/src/theme/ThemeProvider.tsx` with consistent Material UI light/dark palettes and saved preference handling.
- [x] T027 [US4] [Plan:6.2] Add a theme toggle, responsive layouts, keyboard/focus semantics, and accessible loading/error announcements across auth, search, navigation, and watchlist components; add viewport/theme component assertions.
- [x] T028 [US4] [Plan:6.2,6.1] Extend Playwright browser checks for 320/768/1920 CSS-pixel layouts, theme persistence across navigation/reload, and absence of horizontal overflow.

### Phase 7: Cross-Cutting Docker and Runtime Verification

- [x] T029 [Plan:7.1] Add `frontend/Dockerfile`, `frontend/.dockerignore`, `frontend/docker/nginx.conf.template`, and a runtime entrypoint that validates and publishes the API origin without embedding credentials or requiring an image rebuild.
- [x] T030 [Plan:7.1] Add and verify a Docker health route and non-root static-serving process; ensure SPA route fallback works for direct navigation and refresh.
- [x] T031 [Plan:7.2] Run `npm test`, `npm run build`, Playwright E2E, responsive/theme checks, and Docker image/runtime-origin verification; record exit codes and test counts.

## Requirement Mapping

| REQ ID | Description | Plan Items | Implementation Evidence |
|--------|-------------|------------|------------------------|
| REQ-001 | Registration page and backend submission | 3.1 | `RegisterPage.tsx`, registration tests |
| REQ-002 | Login page and backend submission | 3.1, 3.2 | `LoginPage.tsx`, auth API tests |
| REQ-003 | Session-only JWT storage; never store password | 3.2 | `sessionStorage.ts`, `AuthProvider.test.tsx` |
| REQ-004 | Restrict bearer authorization to configured API | 1.2, 2.1 | `apiConfig.ts`, `httpClient.ts`, client tests |
| REQ-005 | Revoke on logout and clear local session | 3.2 | `AuthProvider.tsx`, logout tests |
| REQ-006 | Clear invalid local session on protected API 401 | 2.1, 3.2 | `httpClient.ts`, session tests |
| REQ-007 | Protected application routes and navigation | 2.2, 3.2 | `ProtectedRoute.tsx`, `AppRouter.tsx` |
| REQ-008 | Display personal watchlist and empty state | 4.1, 4.2 | `useWatchlist.ts`, `WatchlistPage.tsx` |
| REQ-009 | Add stocks only after backend confirmation | 4.1, 4.2, 5.2 | `watchlistApi.ts`, `AddStockForm.tsx`, search add tests |
| REQ-010 | Remove stocks only after backend confirmation | 4.1, 4.2 | `useWatchlist.ts`, `WatchlistPage.tsx` and tests |
| REQ-011 | Search symbol/name and show identifying fields | 5.1, 5.2 | `StockSearchPage.tsx`, `stockApi.ts` |
| REQ-012 | Paginated search and next-page indication | 5.1, 5.2 | `useStockSearch.ts`, `SearchResults.tsx` |
| REQ-013 | Actionable non-sensitive errors | 1.2, 2.1, 3.1, 4.1, 5.1 | `types.ts`, `httpClient.ts`, feature form tests |
| REQ-014 | Responsive views for phone/tablet/desktop | 1.1, 2.2, 4.2, 5.2, 6.2 | Material UI layouts and responsive Playwright checks |
| REQ-015 | Light/dark themes and user control | 6.1, 6.2 | `ThemeProvider.tsx`, theme toggle tests |
| REQ-016 | Persist theme; use system preference by default | 6.1 | `themePreference.ts`, persistence tests |
| REQ-017 | Automated frontend workflow and error tests | 1.1, 2.1, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 7.2 | Vitest/RTL suites and Playwright journeys |
| REQ-018 | Docker deployment with runtime backend origin | 1.2, 7.1, 7.2 | Dockerfile, runtime entrypoint, container smoke checks |
