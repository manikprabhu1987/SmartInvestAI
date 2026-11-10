<!--
Sync Impact Report
- Version change: unversioned draft -> 1.0.0 (formal versioned baseline; no prior
  semantic version existed).
- Modified principles: Technology Stack -> Target Technology Stack; Security ->
  III. Secure-by-Default; Coding Standards -> I. Layered Architecture and Clean
  Design; Testing -> II. Test-First Quality; added IV. Trustworthy Market Data
  and Analysis and V. Operable, Containerized Delivery.
- Added sections: Migration Mode; five testable core principles; Target
  Technology Stack; Security, Privacy, and Financial Data; Development Workflow
  and Quality Gates; Governance.
- Removed sections: none substantively; prior standalone headings were
  consolidated into the new principles and constraints.
- Template consistency checks:
  - ✅ skills/creating-implementation-plan/templates/plan-template.md — its
    Constitution Check gate supports review against the principles; no edit
    was needed.
  - ✅ skills/feature-inventory/templates/spec-template.md — its mandatory
    scope, scenarios, requirements, and measurable outcomes align; no edit was
    needed.
  - ✅ skills/creating-implementation-plan/templates/tasks-template.md — its
    test-first guidance aligns; the user's explicit TDD requirement means test
    tasks are required for this project; no edit was needed.
  - ✅ Workspace command SKILL.md files and runtime guidance — none were
    present in the working tree; the tracked README contains only the project
    title.
- Follow-up TODO: confirm the original ratification date.
-->

# SmartInvest AI Constitution

## Migration Mode

**Mode**: REWRITE

**Justification**: SmartInvest AI is being established as a new stock analysis
product using a starter scaffold, not migrated from a production system. New
features MUST follow the architecture and quality constraints below.

## Core Principles

### I. Layered Architecture and Clean Design

The backend MUST use a REST API and separate controller, service, and repository
responsibilities. Controllers handle transport concerns, services own
application and domain behavior, and repositories handle persistence. API
contracts MUST use DTOs rather than exposing persistence entities. Components
MUST have clear responsibilities, depend on abstractions where appropriate,
and follow SOLID principles. The React frontend MUST keep presentation separate
from API communication and domain-specific view logic. This separation keeps
business rules testable and limits change impact.

### II. Test-First Quality

Development MUST follow the red-green-refactor cycle: add or update an
automated test first, confirm that it fails for the intended reason, implement
the smallest behavior that passes, and refactor while keeping tests green.
Backend tests MUST use JUnit 5. Changes to API behavior, authorization, market
data handling, analysis, persistence, or user workflows MUST include relevant
automated tests. A change MUST NOT be considered complete while its required
tests fail or have not been run.

### III. Secure-by-Default

All non-public API operations MUST authenticate requests with JWTs and authorize
each operation against the authenticated user's permissions and data ownership.
Passwords MUST be stored only as adaptive one-way hashes, never as plaintext or
reversible encryption. Secrets, signing keys, and credentials MUST be supplied
through protected runtime configuration, never committed to source control.
Inputs MUST be validated at trust boundaries, sensitive data MUST be minimized
in logs and API responses, and security-sensitive failures MUST be explicit
without disclosing secrets.

### IV. Trustworthy Market Data and Analysis

Market-data integrations MUST preserve source, instrument identity, currency,
and observation or retrieval time wherever available. Missing, stale, invalid,
or unavailable data MUST be reported as such; the system MUST NOT silently
substitute values or present incomplete analysis as current. Technical and
fundamental results and recommendations MUST be reproducible from documented
inputs and rules, and user-facing results MUST disclose material assumptions,
limitations, and data freshness. The platform MUST NOT represent automated
analysis as guaranteed returns or personalized financial advice.

### V. Operable, Containerized Delivery

The application MUST be deployable using Docker with configuration supplied at
runtime. Container images MUST avoid embedded credentials and run with only the
privileges required by the application. Services MUST expose actionable health
status and emit useful, structured operational logs without recording secrets.
Deployment and runtime failures MUST remain visible; the application MUST NOT
report success when a required dependency or operation has failed.

## Target Technology Stack

| Component | Target Version | Notes |
|-----------|---------------|-------|
| JDK | 21 | Backend runtime and build target |
| Framework | Spring Boot 3.x | Backend REST API |
| Build Tool | Maven | Backend build and dependency management |
| Frontend | React | TypeScript is used by the existing frontend scaffold |
| Database | MySQL | Persistent application data |
| Authentication | JWT | Token-based API authentication |
| Testing | JUnit 5 | Required backend test framework |
| Deployment | Docker | Containerized application delivery |

## Security, Privacy, and Financial Data

Authorization MUST be enforced on the server for every user-owned watchlist,
portfolio, and related resource; possession of an identifier MUST NOT grant
access. JWT validation MUST verify signature, expiry, and configured issuer and
audience where applicable, and tokens MUST be transmitted only over protected
connections in deployed environments. The application MUST use parameterized
database access and safe output handling.

Market data and analysis MUST respect the applicable provider's terms, licensing,
and attribution requirements. User portfolio data and account information MUST
be treated as sensitive. Logs and error responses MUST exclude passwords,
tokens, signing keys, and unnecessary personal or financial details. Database
schema changes MUST be reproducible and reviewed; production data MUST NOT
depend on development-only defaults.

## Development Workflow and Quality Gates

Code MUST be readable, consistently named, and narrowly scoped. Duplication and
unnecessary abstractions MUST be avoided; deviations from the established
architecture require a documented reason. API changes MUST preserve clear
validation and error semantics and include corresponding contract or integration
coverage where appropriate.

Before a change is accepted, the author MUST run the relevant automated tests
and applicable build, type-check, or lint checks. Pull-request review MUST
verify requirements traceability, test-first evidence, authorization and data
handling, and the effect on existing behavior. Docker configuration changes
MUST be checked for runtime configuration, health behavior, and secret
exposure. Any waived quality gate MUST identify the reason, impact, and
follow-up action in the change record.

## Governance

This constitution governs project design and delivery decisions. Amendments
MUST be made in this file, state their rationale, and update the version and
last-amended date. Versioning follows semantic versioning: MAJOR for
backward-incompatible changes to principles or governance, MINOR for new or
materially expanded requirements, and PATCH for clarifications that do not
change obligations.

Every proposed change and release MUST be reviewed for compliance with the
principles and quality gates. Any exception MUST be explicit, narrowly scoped,
approved by the project maintainers, and recorded with its rationale and
mitigation; undocumented exceptions are not permitted. When implementation
guidance conflicts with this constitution, the conflict MUST be resolved before
the affected work proceeds.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): confirm original adoption date | **Last Amended**: 2026-11-09
