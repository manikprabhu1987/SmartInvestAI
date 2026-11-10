# Feature Specification: Stock Watchlist Management

> Governed by: `../project-constitution.md`

**Feature Branch**: `002-stock-watchlist`  
**Created**: 2026-11-09  
**Status**: Draft  
**Input**: User description: Create stock watchlist management module. Users can
add and remove stocks, view their watchlist, and search stocks. Stock symbols
must exist and duplicates are not allowed. Return proper error messages, store
data in MySQL, provide REST APIs, and write unit tests.

## Scope Baseline *(mandatory)*

- **Discovery method**: User-provided feature description; authentication
  prerequisite scope was approved during planning.
- **Total items discovered**: 5 requested capabilities: add, remove, view,
  search, and validate uniqueness and symbol existence.
- **Items in scope**: The 5 requested capabilities plus the approved
  registration/login/logout prerequisite. Persistence, REST access, error
  reporting, and unit testing are cross-cutting constraints.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a Stock to a Watchlist (Priority: P1)

As an authenticated investor, I want to add a valid stock to my watchlist so
that I can keep track of securities I am interested in.

**Why this priority**: Adding a stock is the core action that creates a useful
watchlist.

**Independent Test**: Submit a request to add a supported stock symbol and
confirm it appears in the authenticated user's watchlist; repeat with an
unknown and an already-listed symbol and confirm clear errors are returned.

**Acceptance Scenarios**:

1. **Given** an authenticated user and a stock that exists and is not in their
   watchlist, **When** they add its symbol, **Then** the stock is added and the
   response confirms the symbol and identifying stock information.
2. **Given** a symbol that does not identify a supported stock, **When** the
   user tries to add it, **Then** the stock is not added and an error explains
   that the symbol is unknown or unsupported.
3. **Given** a stock already in the user's watchlist, **When** they add the
   same symbol again, **Then** the watchlist remains unchanged and an error
   explains that the stock is already listed.
4. **Given** a malformed or blank symbol, **When** the user tries to add it,
   **Then** the request is rejected with a field-specific validation message.

### User Story 2 - View and Remove Watchlist Stocks (Priority: P1)

As an authenticated investor, I want to see the stocks in my watchlist and
remove a stock I no longer want to track.

**Why this priority**: Viewing and maintaining the list are necessary to use it
after stocks have been added.

**Independent Test**: Add a stock, retrieve the watchlist, remove that stock,
and retrieve the watchlist again to confirm it is absent.

**Acceptance Scenarios**:

1. **Given** a user with watchlist entries, **When** they view their watchlist,
   **Then** they receive all and only their entries with identifying stock
   information.
2. **Given** a user with no entries, **When** they view their watchlist,
   **Then** they receive a successful empty-list response.
3. **Given** a stock in the user's watchlist, **When** they remove that stock,
   **Then** it is removed and the response confirms the result.
4. **Given** a stock that is not in the user's watchlist, **When** they try to
   remove it, **Then** the list is unchanged and a clear not-found message is
   returned.
5. **Given** another user's watchlist entry, **When** a user attempts to view
   or remove it, **Then** the operation does not disclose or modify the other
   user's data.

### User Story 3 - Search for Stocks (Priority: P2)

As an authenticated investor, I want to search supported stocks by symbol or
company name so that I can find the correct stock before adding it.

**Why this priority**: Search makes it easier to find valid symbols and reduces
entry errors; users can still add a known symbol without search.

**Independent Test**: Search using a known symbol and a company-name fragment,
then verify matching stocks are returned and an unmatched query produces an
empty result.

**Acceptance Scenarios**:

1. **Given** a non-empty query matching a supported stock's symbol, **When**
   the user searches, **Then** matching stocks are returned with symbol and
   company name.
2. **Given** a non-empty query matching a supported company's name, **When**
   the user searches, **Then** matching stocks are returned.
3. **Given** a query that matches no supported stock, **When** the user
   searches, **Then** a successful empty result is returned.
4. **Given** a blank query, **When** the user searches, **Then** a clear
   validation error is returned.

### Foundational User Flow - Account Authentication (Priority: P1)

As a new user, I want to register, log in, and log out so that watchlist
operations are associated with my authenticated account. This prerequisite flow
is included in this plan by user direction and follows the existing
`001-authentication` feature scope.

**Independent Test**: Register a unique account, log in to receive a JWT, use it
to access a protected endpoint, log out, and verify that the same token is
rejected afterward.

**Acceptance Scenarios**:

1. **Given** a valid registration request with an unused email, **When** the
   user registers, **Then** an account is created and the password is stored as
   an adaptive one-way hash.
2. **Given** an email already registered, **When** another registration is
   attempted, **Then** no duplicate account is created and a clear conflict
   error is returned.
3. **Given** valid credentials, **When** the user logs in, **Then** the service
   issues a signed, expiring JWT for that user.
4. **Given** an active JWT, **When** the user logs out, **Then** that token is
   invalidated and subsequent protected requests reject it.

### Edge Cases

- Symbols are matched without regard to letter case and stored or returned in
  the catalog's canonical form.
- Concurrent attempts to add the same symbol to the same user's watchlist
  result in only one entry; the losing request receives the duplicate error.
- A stock deactivated in the supported stock catalog cannot be newly added;
  existing watchlist entries remain visible with
  unavailable or stale status rather than silently disappearing.
- Search results and watchlist entries never include another user's private
  watchlist information.
- If persistence or stock lookup is unavailable, the operation returns a
  clear failure and does not report a successful change.

## Requirements *(mandatory)*

### Functional Requirements

- **REQ-001**: The system MUST allow an authenticated user to add a stock to
  their personal watchlist by symbol.
- **REQ-002**: The system MUST verify that a symbol identifies a supported
  stock before adding it and MUST reject malformed, unknown, or unsupported
  symbols with a clear error.
- **REQ-003**: The system MUST prevent a user from having the same stock more
  than once in their watchlist, including when concurrent add requests occur.
- **REQ-004**: The system MUST allow an authenticated user to retrieve their
  watchlist, returning an empty list when they have no entries.
- **REQ-005**: The system MUST allow an authenticated user to remove a stock
  from their watchlist and MUST return a clear not-found error if it is not
  present.
- **REQ-006**: The system MUST allow users to search supported stocks by symbol
  or company name and MUST return an empty result when there are no matches.
- **REQ-007**: The system MUST reject blank search queries with a clear
  validation error.
- **REQ-008**: The system MUST return actionable, non-sensitive error messages
  for invalid input, unknown stocks, duplicates, missing watchlist entries,
  unauthenticated access, and unavailable dependencies.
- **REQ-009**: The system MUST expose watchlist operations and stock search
  through REST APIs.
- **REQ-010**: The system MUST persist watchlist entries in MySQL and retain
  them across application restarts.
- **REQ-011**: The system MUST restrict each user's watchlist operations to
  that user's own data.
- **REQ-012**: The feature MUST include unit tests for successful operations,
  validation failures, duplicate prevention, stock lookup, and error handling.
- **REQ-013**: The system MUST allow users to register with a unique email and
  MUST store passwords as adaptive one-way hashes.
- **REQ-014**: The system MUST authenticate valid credentials and issue a
  signed, expiring JWT identifying the authenticated user.
- **REQ-015**: The system MUST invalidate a user's active JWT on logout and
  reject that token on subsequent protected requests.
- **REQ-016**: The feature MUST include unit tests for registration, login,
  logout, JWT validation, and unauthorized access.

### Key Entities

- **Stock**: A supported security, identified by its canonical symbol and
  associated identifying information such as company name and availability.
- **Watchlist Entry**: The association between one user and one stock, with
  enough information to identify the stock and when it was added. A user may
  have at most one entry for a given stock.
- **User**: The account that owns a watchlist. Registration, login, and logout
  are implemented as a prerequisite in this plan and follow the existing
  authentication feature's scope.
- **Revoked Token**: A JWT identifier and expiry time retained until expiry so a
  logged-out token cannot be used again.

### Constraints

- The backend MUST follow the project's Java 21 and Spring Boot 3 stack and
  layered architecture.
- REST API behavior MUST use appropriate success and error responses; clients
  MUST be able to distinguish validation, unknown-stock, duplicate, and
  not-found failures.
- Persistent watchlist data MUST use MySQL.
- Backend unit tests MUST use JUnit 5 and follow the project's test-first
  requirement.
- API access MUST follow the project constitution's JWT authentication and
  per-user authorization requirements.
- Authentication prerequisite behavior MUST remain aligned with
  `specs/001-authentication/spec.md`; this plan includes its registration,
  login, and logout work because the baseline has no JWT implementation.

### Assumptions

- A watchlist is private to its authenticated owner; users do not share or
  publish watchlists in this feature.
- A stock is considered valid when it exists in the application's supported
  stock reference catalog. The catalog is stored in MySQL and populated through
  an operational import/seed process; catalog administration endpoints and
  market-data provider integration are outside this feature's scope.
- Search is case-insensitive and matches symbols or company names. Results
  identify the stock but do not include market prices or analysis. Results are
  paginated with a default page size of 20 and maximum of 50.
- A user's watchlist is a single list in this feature; multiple named
  watchlists, ordering controls, alerts, and portfolio tracking are excluded.
- Registration, login, and logout are included as watchlist prerequisites per
  user direction; account recovery, refresh tokens, and federated identity are
  outside scope. Logout revokes the active token identifier until token expiry.
- Registration passwords must be at least 12 characters; no password
  composition rules are imposed by this feature contract.
- API error responses identify the category and affected input where safe and
  provide a user-readable message without exposing internal implementation
  details.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance tests, 100% of valid add requests create exactly
  one watchlist entry, and 100% of unknown or malformed symbols are rejected
  without creating an entry.
- **SC-002**: In acceptance tests, repeating an add for the same user and stock
  never produces more than one entry and always returns an understandable
  duplicate error.
- **SC-003**: Users can view an empty or populated watchlist and remove an
  entry; 100% of tested operations affect only the authenticated user's data.
- **SC-004**: For a stock reference set of at least 1,000 supported stocks,
  search by symbol or company-name fragment returns the expected matches for
  at least 95% of tested queries.
- **SC-005**: At least 95% of watchlist and search operations complete within
  two seconds under normal service conditions, excluding third-party outages.
- **SC-006**: Every tested invalid, duplicate, missing, unauthorized, or
  dependency-failure case produces a specific, user-readable error without
  leaking sensitive or internal details.
- **SC-007**: 100% of authentication acceptance tests verify that registration
  stores no plaintext password, valid login issues an expiring JWT, and logout
  causes the logged-out token to be rejected on the next protected request.
