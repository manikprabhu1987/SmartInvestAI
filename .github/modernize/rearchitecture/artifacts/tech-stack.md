# Technology Stack

This records the committed `HEAD` baseline. Tracked application files are
deleted in the current working tree; the analysis read them with `git show`
and did not restore them.

## Backend

- Language/runtime target: Java 21 (`java.version` in `backend/pom.xml`).
- Build: Maven with Maven wrapper files.
- Framework parent: Spring Boot `4.2.0-SNAPSHOT` in the tracked POM.
- Application dependencies:
  - Spring Boot Actuator.
  - Spring Data JPA.
  - Spring Security.
  - Spring Validation.
  - Spring Web MVC.
  - MySQL Connector/J (runtime).
  - Lombok (optional).
- Test dependencies: Spring Boot Actuator, Data JPA, Security, Validation,
  and Web MVC test starters. The source test uses JUnit Jupiter.
- Observed authentication wiring uses Spring Security form login. No JWT
  dependency or JWT implementation was found.
- No stock-market data provider or API client dependency was found.

## Frontend

- React and React DOM `^19.3.1`.
- TypeScript `~7.0.2`.
- Vite `^8.3.6` with `@vitejs/plugin-react` `^6.1.2`.
- Oxlint `^1.90.0`.
- Node engine/version is not specified in `frontend/package.json`.

## Persistence and Runtime Configuration

- MySQL Connector/J and Spring Data JPA are declared.
- `application.properties` configures a MySQL datasource, JPA schema
  auto-update, SQL display, and backend port.
- The tracked application configuration contains a datasource credential
  value; it is intentionally not repeated here. Runtime secret externalization
  is not evidenced.
- No Dockerfile or Compose configuration is present.

## Constraints and Evidence Gaps

- The tracked Spring Boot parent is `4.2.0-SNAPSHOT`, while the project
  constitution specifies Spring Boot 3.x. This is a baseline discrepancy,
  not a target recommendation.
- The frontend manifest does not declare a Node engine.
- No watchlist code, stock-symbol source/provider, JWT support, or backend
  domain/service/repository implementation was found.
