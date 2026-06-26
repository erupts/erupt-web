# CLAUDE.md — `flow` module

Guidance for the workflow-builder **flow** feature module. Inherits everything in the repo-root `CLAUDE.md`; this file only adds module-specific notes.

## Backend location

The flow backend lives in the directory `erupt-flow`, a sibling of the `erupt-web` repo root (absolute: `/Users/yp.li/code/erupt-flow`; relative to this file: `../../../../../erupt-flow`) — a single-module Maven project, **not** part of the core `erupt` backend. Java package root: `xyz.erupt.flow`. Notable areas:

- `controller/` — `FlowController` (base `/erupt-api/flow`), plus `FlowInstanceController`, `FlowGroupController`, `FlowFlexController`, `FlowUpmsController`, `FlowInstanceCommentController`.
- `annotation/` — `@EruptFlow`, `@EruptFlowProcess`, `@EruptFlowManager`, `FlowProxy`.
- `context/`, `util/` (`NodeUtil`, `FlowUtil`), `scheduler/FlowScheduler`, `cube/` (flow instance cubes for BI).

When a frontend flow model mirrors a backend DTO, the source of truth is `/Users/yp.li/code/erupt-flow`.

## API surface

All endpoints are under `RestPath.erupt` (`/erupt-api`). Frontend services in `service/` call `/flow/*`:

- `/flow/group/*` — flow group CRUD (`list`, `add`, `edit`, ...).
- `/flow/upms/*` — org/role/post/user pickers backing the `upms-select` components.
- `/flow/...` — flow definition, instances, approvals, comments.

## Module shape

- `node/` — one folder per node type the flow graph supports: `start`, `end`, `appoval` (approval), `assignee`, `cc`, `gateway`, `gateway-join`, `flex`, `sub`, `base`. Each renders + configures that node.
- `components/` — reusable pieces: `erupt-flow` (the graph canvas), `erupt-flow-form`, `form-access`, `review-user`, `upms-select(-view)`, `icon-color-picker`.
- `view/` — top-level pages: `flow-management`, `flow-dashboard`, `flow-approval`, `flow-approval-detail`.
- `model/`, `service/`, `util/` — flow DSL types, HTTP services, graph helpers.

The flow graph is a tree of typed nodes; the canvas in `components/erupt-flow` walks that tree, and each `node/<type>` component owns its own rendering and config panel.
