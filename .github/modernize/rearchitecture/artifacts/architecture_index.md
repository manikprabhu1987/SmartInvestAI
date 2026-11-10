# Architecture Index

This analysis describes the committed `HEAD` baseline. Source files deleted in
the current working tree were inspected through Git without restoring them.
No feature-specific stock/watchlist implementation exists in the analyzed
source.

## Implementation Guide

This index is not the full contract. Do not implement from this file alone;
follow the artifact paths below.

### Global artifacts

- `unit_graph.yaml`
  - Who reads: all implementation workers.
  - Use for: existing runtime entry points, triggers, source anchors, and
    dependencies.
  - How to consume: select the assigned unit and follow its entry point and
    source anchors.
- `wire_contracts.yaml`
  - Who reads: workers touching an existing external interface.
  - Use for: the current health endpoint's request, response, and auth facts.
  - How to consume: filter by the assigned unit; the only recorded contract
    belongs to `health-api`.
- `shared_modules.yaml`
  - Who reads: workers sharing existing source modules.
  - Use for: cross-unit module reuse.
  - How to consume: no shared modules were identified in this baseline.
- `cross_unit_state.yaml`
  - Who reads: workers using implicit state across units.
  - Use for: cross-unit state flows.
  - How to consume: no such flows were identified in the analyzed source.
- `project-structure.md`
  - Who reads: planning and implementation workers.
  - Use for: module/layer layout and entry points.
- `tech-stack.md`
  - Who reads: planning and implementation workers.
  - Use for: existing framework, runtime, build, and dependency facts.
- `data-model.md`
  - Who reads: workers touching persistence.
  - Use for: existing entity and schema evidence.
  - How to consume: no persisted entities or mappings were found.

### Unit: `health-api`

- External trigger: `GET /api/health`.
- Must read:
  - `units/health-api/behavior.yaml` — existing response and error behavior.
  - `units/health-api/bindings.yaml` — controller, security, and CORS wiring.
  - `units/health-api/unit_decomposition.yaml` — advisory split candidates.
- Relevant global rows: `wire_contracts.yaml` where `unit == health-api`.
- Before DONE report: artifact paths read, preserved existing contract, any
  deferred changes, and test/build/runtime evidence.

### Unit: `smartinvest-home-page`

- External trigger: the React root page.
- Must read:
  - `units/smartinvest-home-page/behavior.yaml` — current visible page behavior.
  - `units/smartinvest-home-page/bindings.yaml` — React root binding.
  - `units/smartinvest-home-page/unit_decomposition.yaml` — advisory split
    candidates.
- Relevant global rows: no wire contract or shared module currently references
  this unit.
- Before DONE report: artifact paths read, preserved/changed visible behavior,
  deferred work, and frontend validation evidence.
