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

## Code Style

- All code comments must be written in **English**.

## Architecture Overview

This is an **Angular 21 enterprise admin framework** (`erupt-web`) that auto-generates UI/forms from JSON schema definitions provided by a Java backend. The philosophy is "zero frontend code" — UI is driven entirely by schema.

### Backend Integration

The Angular app communicates with an Erupt Java backend. In development, `proxy.conf.js` proxies all `/erupt-api`, `/erupt-attachment`, `/erupt-websocket`, and other backend paths to `http://localhost:9999`. The production build outputs to the Java project's `src/main/resources/public` directory (configured in `angular.json`).

**Backend source location:** the core Erupt Java backend lives in the sibling directory `../erupt` (i.e. `/Users/yp.li/code/erupt`). Key modules there: `erupt-annotation` (the `@Erupt`/`@EruptField`/`@Edit`/`@View`/`@Vis` annotation definitions that drive every schema), `erupt-core` (model registry, build pipeline), `erupt-web` build output target, and `erupt-designer` (the form-designer backend powering `src/app/build/designer/`). Feature modules `cube` and `flow` have their own backends in separate sibling dirs — see their local `CLAUDE.md` files. When the frontend mirrors an annotation structure (e.g. the designer's `DesignerForm`), the source of truth is `../erupt/erupt-annotation`.

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

### Dark Theme

The app supports a runtime dark theme (settings drawer → 夜间模式, persisted as `localStorage["dark-theme"]`, default via `eruptSiteConfig.darkTheme`):

- Theme less lives in `src/styles/themes/` (`dark.less`, `compact.less`, `compact-dark.less`, plus `brutalist.less`, which is part of the main bundle via styles.less). Three lazy theme bundles (angular.json `inject:false`, stable non-hashed names): `themes/dark.less` → `style.dark.css`, `themes/compact.less` → `style.compact.css`, and `themes/compact-dark.less` (dark + compact merged) → `style.compact-dark.css`. `index.html` owns the single `<link id="site-theme-style">` swapped between them via `window.eruptApplyDarkTheme(bool)` / `window.eruptApplyCompactTheme(bool)` (applied pre-bootstrap to avoid a flash; `dark-theme` localStorage supports `"auto"` = follow the OS scheme, with a live `matchMedia` listener). **Changing angular.json bundles requires a dev-server restart** — a stale server answers the css URLs with the SPA-fallback HTML (empty stylesheet, no error).
- Dark sidebar in light mode: `html.aside-dark` class (localStorage `aside-dark`, config `asideDark`), styled in tokens.less via delon's `--alain-default-aside-*` hooks plus scoped rules, `:not(.dark):not(.brutalist-theme)`.
- `src/styles/tokens.less` defines semantic `--erupt-*` color tokens on `html` (light) and `html.dark` (dark), plus dark remaps of `--ant-primary-1..3` and a block (scoped `html.dark, html.compact`) re-anchoring high-visibility ant components to the runtime `--ant-primary-*` brand color (the compiled lazy theme css uses a fixed primary), and a shared dark-aside block (`html.dark, html.aside-dark`) holding the ONE copy of sidebar menu states for both dark sidebars. Low-specificity re-anchors (plain `a`) live at the END of `themes/dark.less` / `themes/compact.less` instead — never add a bare `html.dark a`-style rule in tokens.less: its extra specificity beats component link styles (this once turned every sidebar menu item brand-orange).
- Theme color and header color are user-configurable in the settings drawer: `localStorage["theme-color"]` (primary palette via NzConfigService) and `localStorage["header-color"]` (`"primary"` or a literal color; `applyHeaderColor()` in `@shared/util/theme.util` sets `--erupt-header-*` inline on `<html>`, with luminance-based foreground). Header styles must use the `--erupt-header-*` tokens, not `--erupt-text`/`--erupt-bg-container`.
- **Never hard-code light-theme colors in less files** (`#fff` surfaces, black-based text, light borders/fills). Use the tokens with the original value as fallback, e.g. `background: var(--erupt-bg-container, #fff)`. Colors on brand/colored/intentionally-dark surfaces (white text on primary buttons, node card headers, terminal) stay literal. Charts/editors follow `document.documentElement.classList.contains('dark')` (see bi chart, cube report, code-editor, markdown components).

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
