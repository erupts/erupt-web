# CLAUDE.md — `cube` module

Guidance for the OLAP / BI **cube** feature module. Inherits everything in the repo-root `CLAUDE.md`; this file only adds module-specific notes.

## Backend location

The cube backend lives in the directory `erupt-cube`, a sibling of the `erupt-web` repo root (absolute: `/Users/yp.li/code/erupt-cube`; relative to this file: `../../../../../erupt-cube`) — a separate Maven multi-module project, **not** part of the core `erupt` backend. Relevant submodules:

- `erupt-cube-semantic` — semantic layer: cube/explore/measure/dimension metadata, query engine. Java pkg `xyz.erupt.cube.semantic`.
- `erupt-cube-puzzle` — dashboard ("puzzle") persistence, publishing, history, AI tools. Java pkg `xyz.erupt.cube.puzzle`.
- `erupt-cube-metric`, `erupt-cube-design` — metric definitions and design-time support.

When a frontend cube model mirrors a backend DTO/annotation, the source of truth is `/Users/yp.li/code/erupt-cube`.

## API surface

All endpoints are under `RestPath.erupt` (`/erupt-api`). Frontend services in `service/` call:

- `/cube/semantic/*` → `erupt-cube-semantic` (`SemanticController`): `cubes`, `{cube}/explores`, `metadata/{cube}/{explore}`, `query`, `parameter-items/...`.
- `/cube/dashboard/*` → `erupt-cube-puzzle` (`DashboardController`): `detail/{code}`, `update-dsl/{id}`, `publish-dsl/{id}`, `publish-history/{id}`, `rollback-dsl/{id}`.

## Module shape

- `view/cube-puzzle-dashboard*` — the gridster-based dashboard (edit/view/config), filters, reports.
- `view/cube-puzzle-report*`, `cube-puzzle-filter*`, `cube-puzzle-sub-model-config` — report/filter/sub-model config dialogs.
- `view/cube-drill-detail` — drill-down detail.
- `model/`, `service/` — DSL types and HTTP services.

The dashboard DSL (reports + filters + settings) is what `update-dsl` / `publish-dsl` persist; the rendering pipeline is fully DSL-driven, consistent with the repo's schema-driven philosophy.
