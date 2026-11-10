# API & Service Communication Contracts

The tracked baseline exposes one custom HTTP endpoint and a static frontend
page. No watchlist routes, service-to-service calls, or asynchronous messaging
were found.

## Service Catalog

| Service | Port | Category | Purpose |
|---|---:|---|---|
| Backend | 8080 | API Layer | Spring Boot health endpoint and application API |
| Frontend | 5173 (Vite default) | Client | React single-page starter |

## API Endpoints Inventory

| Service | Method | Path | Request Type | Response Type |
|---|---|---|---|---|
| Backend / HealthController | GET | `/api/health` | None | HTTP 200 plain text |

No versioning scheme or watchlist endpoint exists in the analyzed source.

## Management & Observability Endpoints

| Service | Endpoint | Custom Metrics |
|---|---|---|
| Backend | Spring Boot Actuator dependency is present; exposed management paths are not configured in the inspected source | No custom metrics found |

## DTOs & Contracts

No request/response DTO classes, OpenAPI specification, protobuf schema,
GraphQL schema, or custom serializer configuration was found. The health
controller returns a string directly. No gateway aggregation DTOs exist.

## Communication Patterns

- The health route uses synchronous in-process Spring MVC dispatch.
- No HTTP client, message broker, retry policy, circuit breaker, service
  discovery, or gateway aggregation was found.
- The health route is public. Spring Security requires authentication for
  other requests and configures form login; no JWT behavior was found.
- No application TLS configuration was found in the inspected source.
- The application has a MySQL/JPA dependency and datasource configuration, but
  no repository-backed endpoint or persistence call exists in the source.

## Service Technology Matrix

| Service | Web | Data Access | Discovery | Gateway | Actuator | Cache | Metrics |
|---|---|---|---|---|---|---|---|
| Backend | Spring MVC | Spring Data JPA dependency; no repository usage found | None found | None found | Dependency present | None found | No custom metrics found |
| Frontend | React/Vite | None | None | None | N/A | None found | None found |

## Service Communication Sequence

<!-- mermaid-checked: every participant uses `participant Id as "Label"`, no \n in aliases/messages/notes, every alt/opt/loop closed by end, no `:` inside any alias -->
~~~mermaid
sequenceDiagram
    participant Client as "HTTP Client"
    participant API as "Spring Boot API"
    participant Health as "Health Controller"
    Client->>API: GET /api/health
    API->>Health: Route request
    Health-->>API: Plain-text health status
    API-->>Client: HTTP 200 text/plain
~~~
