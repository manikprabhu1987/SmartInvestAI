# Feature Specification: SmartInvest AI React Frontend

> Governed by: [project constitution](../project-constitution.md)

**Feature Branch**: `003-react-frontend`  
**Created**: 2026-11-10  
**Status**: Draft  
**Input**: User description: Create a responsive React frontend for SmartInvest AI with registration, login, JWT-backed logout, personal watchlist management, paginated stock search, Material UI, light/dark themes, Spring Boot REST integration, automated tests, and Docker support.

## Scope Baseline *(mandatory)*

- **Discovery method**: User-provided feature description, existing stock-watchlist specification, and its REST contract.
- **Total items discovered**: 7 capability groups: authentication, watchlist management, stock search, responsive UI, theme preferences, backend integration, and testing/container delivery.
- **Items in scope**: All 7 capability groups. Existing backend APIs are consumed; backend endpoints, portfolio features, and market-analysis features are not added by this frontend feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register and Access an Account (Priority: P1)

As a prospective investor, I want to register, log in, and log out so that I can access my own watchlist securely.

**Why this priority**: Authentication is required to use any protected watchlist or stock-search operation.

**Independent Test**: Complete registration, log in with the new account, verify access to a protected screen, log out, and verify protected content is no longer available.

**Acceptance Scenarios**:

1. **Given** a visitor on the registration page, **When** they submit a valid name, email, and password, **Then** the frontend submits the documented registration request and presents the resulting account confirmation.
2. **Given** invalid registration input or an email already in use, **When** registration is submitted, **Then** the relevant field or server error is shown without discarding the user's other input.
3. **Given** a registered user, **When** they submit valid login credentials, **Then** the frontend stores the returned access token for the current browser session and opens the authenticated application.
4. **Given** invalid credentials or an unavailable authentication service, **When** login is attempted, **Then** a clear error is shown and no authenticated session is created.
5. **Given** an authenticated user, **When** they choose logout, **Then** the frontend requests token revocation, clears its local authenticated state, and returns to the login page; the old token is not used for later requests.
6. **Given** a user whose token is expired, revoked, or rejected by the API, **When** a protected request is made, **Then** the frontend clears the session and requests authentication again.

### User Story 2 - Manage a Personal Watchlist (Priority: P1)

As an authenticated investor, I want to view, add, and remove stocks from my watchlist so that I can maintain the securities I follow.

**Why this priority**: A watchlist is the central user workflow supported by the existing backend.

**Independent Test**: Sign in, view an empty watchlist, add a known catalog symbol, verify the entry appears, remove it, and verify it is absent.

**Acceptance Scenarios**:

1. **Given** an authenticated user with saved entries, **When** they open the watchlist, **Then** the frontend displays only the entries returned for their authenticated account, including symbol and company name.
2. **Given** an authenticated user with no entries, **When** they open the watchlist, **Then** the frontend displays a successful empty state with a way to find stocks.
3. **Given** an authenticated user and a supported symbol, **When** they submit the add-stock action, **Then** the frontend confirms the stock after the API reports success and updates the displayed watchlist.
4. **Given** a malformed or unknown symbol, a duplicate entry, or a failed API request, **When** an add action is submitted, **Then** the frontend displays the corresponding actionable error and does not show the stock as saved.
5. **Given** an entry in the user's watchlist, **When** they confirm its removal, **Then** the frontend removes it from the displayed list only after the API confirms success.
6. **Given** a failed removal or an entry that is no longer present, **When** removal is attempted, **Then** the frontend displays the API error and does not falsely report successful removal.

### User Story 3 - Search and Select Stocks (Priority: P1)

As an authenticated investor, I want to search supported stocks by symbol or company name and move through results so that I can find stocks to add.

**Why this priority**: Search is the intended discovery flow for adding supported stocks and helps users avoid invalid symbols.

**Independent Test**: Search for a known symbol and a company-name fragment, navigate result pages, add a result, and verify empty and invalid-query behavior.

**Acceptance Scenarios**:

1. **Given** an authenticated user on stock search, **When** they enter a non-empty symbol or company-name query, **Then** matching catalog results are shown with symbol and company name.
2. **Given** a query with no matches, **When** search completes, **Then** the frontend shows an empty-results state rather than treating it as a failure.
3. **Given** a query with multiple result pages, **When** the user selects next or previous, **Then** the corresponding result page is requested and the visible page state is updated.
4. **Given** a blank query or invalid pagination response, **When** the search is submitted or changed, **Then** the frontend displays a clear validation message and does not present stale results as current.
5. **Given** a stock-search result, **When** the user adds it to the watchlist, **Then** the frontend uses its canonical symbol and follows the same success and error behavior as adding from the watchlist screen.

### User Story 4 - Use the App Across Devices and Themes (Priority: P2)

As an investor, I want a readable, responsive interface with light and dark themes so that I can use the application comfortably on my preferred device and display setting.

**Why this priority**: Responsive layouts and theme choice improve usability across common environments without changing account or watchlist behavior.

**Independent Test**: Open the main screens at phone, tablet, and desktop viewport sizes; switch themes and navigate between screens.

**Acceptance Scenarios**:

1. **Given** a phone-sized, tablet-sized, or desktop viewport, **When** the user visits registration, login, search, or watchlist, **Then** the content and controls remain readable and usable without unintended horizontal scrolling.
2. **Given** either theme, **When** the user switches between light and dark mode, **Then** the selected appearance is applied consistently to all frontend screens.
3. **Given** a returning visitor with a previously selected theme, **When** they reopen the application, **Then** that preference is restored; otherwise the interface follows the device appearance preference.
4. **Given** an interactive control, **When** the user operates it by keyboard or assistive technology, **Then** its purpose, focus, and status are perceivable and operable.

### Edge Cases

- The API returns an empty watchlist or empty search page.
- Network loss or a backend 5xx occurs while loading, adding, removing, registering, or logging in.
- A request is pending when the user changes pages, signs out, or submits another query; the UI must not overwrite newer state with an older response.
- The backend returns a validation, duplicate, not-found, unauthorized, or unavailable-dependency problem response.
- The token expires or is revoked while the application is open.
- The saved theme preference is absent or unreadable.
- Registration succeeds but the subsequent login has not yet occurred; registration must not be presented as an authenticated session.

## Requirements *(mandatory)*

### Functional Requirements

- **REQ-001**: The frontend MUST provide a registration page with name, email, and password inputs and submit them using the backend's documented registration contract.
- **REQ-002**: The frontend MUST provide a login page and submit email and password using the backend's documented login contract.
- **REQ-003**: After successful login, the frontend MUST retain the returned JWT access token for the current browser session and MUST NOT store the user's password.
- **REQ-004**: The frontend MUST attach the JWT as a bearer authorization header to protected backend requests and MUST NOT send it to unrelated origins.
- **REQ-005**: The frontend MUST provide logout, request revocation through the documented API, clear local authentication state, and prevent subsequent protected requests from reusing the cleared token.
- **REQ-006**: The frontend MUST handle an unauthorized response from a protected API by clearing the invalid local session and returning the user to an unauthenticated route with a clear message.
- **REQ-007**: The frontend MUST restrict authenticated application routes to a valid local session and provide navigation between stock search and watchlist screens.
- **REQ-008**: The frontend MUST retrieve and display the authenticated user's watchlist, including an explicit empty state.
- **REQ-009**: The frontend MUST allow a user to add a catalog stock by symbol and reflect success only after the backend confirms the addition.
- **REQ-010**: The frontend MUST allow a user to remove a watchlist stock and reflect success only after the backend confirms removal.
- **REQ-011**: The frontend MUST allow authenticated users to search stocks by symbol or company-name query and display the returned symbol and company name.
- **REQ-012**: The frontend MUST support paginated stock-search results using the backend's page and size fields and indicate whether another page is available.
- **REQ-013**: The frontend MUST present actionable validation and server errors for registration, login, search, add, remove, and loading failures without exposing tokens or other secrets.
- **REQ-014**: The frontend MUST support responsive registration, login, search, and watchlist views suitable for phone, tablet, and desktop viewport sizes.
- **REQ-015**: The frontend MUST provide light and dark themes across all application screens and allow the user to change the theme.
- **REQ-016**: The frontend MUST persist the user's theme preference locally and use the device preference when no saved preference exists.
- **REQ-017**: The frontend MUST include automated tests for authentication flows, protected navigation, API authorization headers, watchlist operations, search pagination, error handling, and theme behavior.
- **REQ-018**: The frontend MUST be buildable and runnable as a Dockerized service using runtime configuration for the backend API origin; no credentials or signing keys may be embedded in the frontend image.

### Integration Contract

The frontend consumes the existing backend contract at the configured API origin with the `/api/v1` prefix:

| User action | Method and path | Expected behavior |
|---|---|---|
| Register | `POST /api/v1/auth/register` | Submit `name`, `email`, and `password`; display account confirmation or validation/conflict errors. |
| Log in | `POST /api/v1/auth/login` | Submit `email` and `password`; use the returned `accessToken`, `tokenType`, `expiresAt`, and `user`. |
| Log out | `POST /api/v1/auth/logout` | Send bearer token; handle the successful no-content response and clear local state. |
| Search | `GET /api/v1/stocks/search?q={query}&page={page}&size={size}` | Render `items`, `page`, `size`, and `hasNext`; default page size is 20 and maximum is 50. |
| View watchlist | `GET /api/v1/watchlist` | Render the returned `items` array. |
| Add stock | `POST /api/v1/watchlist` | Submit `{ "symbol": "..." }`; render the returned stock entry on success. |
| Remove stock | `DELETE /api/v1/watchlist/{symbol}` | Render the confirmed removal; show not-found and other documented errors. |

Error responses use the backend's safe `application/problem+json` representation, including a user-readable `detail` and stable `code`. The frontend MUST preserve the distinction between validation, unknown stock, duplicate, unauthorized, not-found, and unavailable-service outcomes.

### Key Entities

- **Authenticated Session**: Current signed-in user's profile, access token, and expiry information held for the active browser session.
- **Stock Summary**: A catalog result with canonical symbol, company name, optional exchange code, and active status.
- **Watchlist Entry**: A user's saved stock with its identifying stock summary and time added.
- **Search Page**: A page of matching stock summaries with page number, page size, and a next-page indicator.
- **API Problem**: A safe backend error with status, readable detail, and a stable error code.
- **Theme Preference**: The locally selected light or dark appearance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In usability tests, at least 95% of users can register or sign in and reach their watchlist without assistance.
- **SC-002**: At least 95% of users can search for a known stock and add it to their watchlist in under 60 seconds when the backend responds successfully.
- **SC-003**: For successful API responses, search results and watchlist changes are reflected in the interface within 2 seconds for at least 95% of measured interactions, excluding network time before the response.
- **SC-004**: All functional frontend scenarios in this specification pass automated tests, including unauthorized access, API failures, pagination, and confirmed versus failed mutations.
- **SC-005**: Registration, login, search, and watchlist remain operable at viewport widths from 320 to 1920 CSS pixels without unintended horizontal page scrolling.
- **SC-006**: The selected theme remains consistent during navigation and is restored on the next visit in at least 99% of tested preference-preserving sessions.
- **SC-007**: A Docker image can be built and started with the backend API origin supplied at runtime, without embedding account credentials or JWT signing material.

## Assumptions

- The existing Spring Boot service and its registration, login, logout, watchlist, and stock-search endpoints are the authoritative data and authorization source; this feature does not add or change backend business behavior.
- Registration creates an account but does not issue a JWT; the user signs in after registration.
- Only the access token is stored in browser session storage for the active tab session. Refresh tokens, persistent "remember me", account recovery, and federated login are outside scope.
- Search uses the existing API defaults of page 0, page size 20, and a maximum page size of 50. The interface may debounce text search, but submitted queries and pagination must follow the API contract.
- The application displays catalog identity and watchlist membership only; quotes, portfolio data, technical/fundamental analysis, and recommendations are outside this frontend feature.
- The configured API origin is supplied through deployment/runtime configuration and may be the same origin or a separately configured backend origin.
- When a successful logout response cannot be confirmed, the frontend still clears its local token and reports that server-side revocation could not be confirmed; it does not claim revocation succeeded.

## Constraints

- **Frontend technology**: React 19 with TypeScript, Node.js, Vite, Axios, React Router, and Material UI.
- **Testing technology**: Vitest and React Testing Library.
- **Deployment**: Docker support is required.
- **Backend contract**: The frontend must remain compatible with the existing Spring Boot REST API paths and JSON/error shapes listed above.
