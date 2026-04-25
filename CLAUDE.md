# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn install          # Install dependencies (use yarn, not npm)
yarn start            # Start dev server with proxy to backend at localhost:9999
yarn run build        # Production build (allocates 6GB heap - large bundle)
yarn run analyze      # Build with source maps for bundle analysis
yarn run analyze:view # View bundle analysis in browser
yarn run theme        # Regenerate theme CSS
```

No test suite is present in this project.

## Architecture Overview

This is an **Angular 20 enterprise admin framework** (`erupt-web`) that auto-generates UI/forms from JSON schema definitions provided by a Java backend. The philosophy is "zero frontend code" — UI is driven entirely by schema.

### Backend Integration

The Angular app communicates with an Erupt Java backend. In development, `proxy.conf.js` proxies all `/erupt-api`, `/erupt-attachment`, `/erupt-websocket`, and other backend paths to `http://localhost:9999`. The production build outputs to the Java project's `src/main/resources/public` directory (configured in `angular.json`).

### Module Structure

Traditional Angular modules (not standalone), lazy-loaded:

- `src/app/core/` — Singleton services: startup initialization (`APP_INITIALIZER`), HTTP interceptors (auth token injection), i18n
- `src/app/shared/` — Shared module: reusable components, pipes (safe-html, i18n), directives, services
- `src/app/layout/` — Layout shells: `erupt/` (main dashboard), `passport/` (login), `blank/`
- `src/app/routes/` — Top-level page components (home, fill-form, exception pages)
- `src/app/build/` — Lazy-loaded feature modules:
  - `erupt/` — Core CRUD module: auto-renders tables, forms, and trees from schema
  - `cube/` — OLAP/BI cube queries and drill-downs
  - `bi/` — Dashboard builder with gridster grid layout
  - `flow/` — Workflow builder
  - `ai/` — AI features
  - `tpl/` — Custom template rendering

### Schema-Driven UI (Core Concept)

The most important pattern to understand: `DataService` fetches JSON schema from the backend describing data models (fields, types, validations, relations). `UIBuildService` (`src/app/build/erupt/service/ui-build.service.ts`) translates that schema into Angular component configurations. `DataHandlerService` handles form data transformations. All CRUD form fields are in `src/app/build/erupt/components/` (date, choice, search, reference, tree-select, etc.).

### Routing

Hash-based routing. Feature modules are lazy-loaded:
- `/build/*` → erupt CRUD
- `/cube/*` → OLAP cubes
- `/bi/:name/*` → dashboards
- `/flow/*`, `/ai/*`, `/tpl/:name/*`

### Customization Entry Points

`src/app.js` — Runtime config injected as `window.eruptSiteConfig` — controls branding (title, logos, theme colors), login callbacks, upload URL overrides, and right-side toolbar items. `src/app/app.component.ts` exposes ng-zorro modal/message/notification services on `window` for use by external scripts.

### Path Aliases

```
@shared/*  → src/app/shared/*
@flow/*    → src/app/build/flow/*
@core      → src/app/core/index
@env/*     → src/environments/*
```

### Icons

This project uses **static icon tree-shaking** via `src/style-icons-auto.ts`. Only icons listed in `ICONS_AUTO` are bundled.

**When using an `nzType` icon in a template**, check if it's already imported in `style-icons-auto.ts`. If not, you must:
1. Add the named export to the `import` block (e.g., `FormOutline` from `@ant-design/icons-angular/icons`)
2. Add it to the `ICONS_AUTO` array

Missing icons will silently render as blank at runtime — no build error.

### Key Libraries

- **ng-zorro-antd** — Ant Design components
- **ng-alain / @delon/*** — Admin framework (ACL, auth, form schema, theme)
- **@antv/g2plot, @antv/s2** — Charts and pivot tables
- **monaco-editor** — Code editor fields
- **vditor** — Markdown/rich text editor
- **@micro-zoe/micro-app** — Micro-frontend embedding
- **@worktile/gantt** — Gantt chart visualization
- **angular-gridster2** — Dashboard grid layout
