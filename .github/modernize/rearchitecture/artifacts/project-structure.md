# Project Structure

## Project Type

Full-stack web application with a Spring Boot backend and a React/Vite frontend.
The inventory below describes the committed `HEAD` baseline because the
corresponding tracked files are deleted in the current working tree; no files
were restored or modified during analysis.

## Modules and Layers

| Area | Structure | Observed responsibility |
|---|---|---|
| Backend application | `backend/src/main/java/com/smartinvest/backend/` | Spring Boot entry point |
| Backend configuration | `backend/src/main/java/com/smartinvest/backend/config/` | Security filter chain and CORS filter; 2 Java files |
| Backend controller | `backend/src/main/java/com/smartinvest/backend/controller/` | REST controller; 1 Java file |
| Backend tests | `backend/src/test/java/com/smartinvest/backend/` | Spring context-load test; 1 Java file |
| Backend resources | `backend/src/main/resources/` | Application properties and MySQL/JPA configuration |
| Frontend | `frontend/src/` | React app and entry point; 4 top-level source/style files |
| Frontend assets | `frontend/src/assets/`, `frontend/public/` | Starter images, icons, and static assets |
| Feature specifications | `specs/` | Authentication and project constitution in the tracked baseline |

No service, repository, DTO, entity, stock reference, or watchlist package is
present in the tracked baseline. The backend currently has configuration and a
controller but does not yet demonstrate a complete controller-service-
repository feature.

## Entry Points and External Surfaces

| Entry point | Source | Observed behavior |
|---|---|---|
| Spring Boot application | `backend/src/main/java/com/smartinvest/backend/BackendApplication.java:6-10` | Starts the Spring application |
| Health API | `backend/src/main/java/com/smartinvest/backend/controller/HealthController.java:9-12` | `GET /api/health` returns a plain-text status |
| React root | `frontend/src/main.tsx:6-9` | Mounts the `App` component |
| Home page | `frontend/src/App.tsx:1-10` | Renders static starter headings; no route or API interaction is present |

## Configuration Files

| File | Role |
|---|---|
| `backend/pom.xml` | Maven, Java version, Spring Boot parent and application/test dependencies |
| `backend/src/main/resources/application.properties` | Application name, MySQL connection, JPA settings, and server port |
| `frontend/package.json` | Frontend scripts and React/Vite/TypeScript dependencies |
| `frontend/vite.config.ts` | Vite build/dev-server configuration |
| `frontend/tsconfig*.json` | TypeScript project configuration |

No Dockerfile, Compose file, API contract document, stock-market integration,
or watchlist-specific configuration is present in the tracked baseline.

## Functional Areas

- **Health**: one unauthenticated backend health route.
- **Starter frontend**: static React landing page.
- **Security/CORS configuration**: form-login security configuration and
  localhost frontend origin allowance; no JWT behavior is present in source.
- **Persistence configuration**: MySQL and Spring Data JPA dependencies and
  connection properties; no persisted entity is present in source.

No stock search, watchlist, portfolio, technical/fundamental analysis, or
recommendation functionality is present in the analyzed baseline.
