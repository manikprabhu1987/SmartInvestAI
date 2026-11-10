# Existing Data Model

This inventory describes the committed `HEAD` baseline. Tracked application
files are deleted in the current working tree; they were inspected without
restoring them.

## Entity Inventory

No entity, model, or database migration classes were found in the tracked
backend source. There are no evidenced table mappings, entity fields,
relationships, or transaction boundaries to preserve.

## Persistence Configuration

- MySQL datasource is configured in
  `backend/src/main/resources/application.properties`.
- Spring Data JPA is declared in `backend/pom.xml`.
- Hibernate schema generation is configured with `ddl-auto=update`.
- No concrete schema, migration tool, or database-level contract is present
  in the tracked source.

## Key Entities

None found in the analyzed baseline. The user, stock, and watchlist entities
mentioned by feature specifications are not existing source entities and are
not inferred or designed here.
