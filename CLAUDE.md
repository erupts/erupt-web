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

**Do not run `yarn run build` / `ng build` to verify changes.** Every build (including `--configuration development`) writes into the sibling Java repo's `erupt-web/src/main/resources/public`, overwriting the committed production bundle. Verify with `npx tsc --noEmit -p tsconfig.app.json` and `npx lessc --js <file>.less` instead; the user builds themselves.

## Code Style

- All code comments must be written in **English**.
- Prefer TypeScript `enum`s over string-literal union types for closed sets of values (menu types, modes, statuses, field types…). Put them next to the model they describe (e.g. `MenuMode` / `MenuTypeEnum` in `@shared/model/erupt-menu`), expose them to templates via a `readonly X = X` field, and never compare against raw string literals in `.ts` or `.html`.

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

The app supports a runtime dark theme (settings drawer → 夜间模式, persisted as `localStorage["dark-theme"]`, default via `eruptSiteConfig.darkTheme` = `true` / `false` / `"auto"`). Appearance defaults live in `eruptSiteConfig.theme` (`src/app.js`): `customizable` (default `true`; `false` hides the branding controls, i.e. theme color / header color / skin / navigation gradient / menu mode, in the settings drawer / sidebar / login page / home page, makes `index.html` purge those saved user keys on load and makes `startup.service` force `menuMode`; light/dark and compact stay user-switchable), `primaryColor`, `headerColor`, `dark` (`true` / `false` / `"auto"`), `compact`, `skin` (`"default"` / `"brutalist"` / `"liquid-glass"` / `"workspace"` / `"classic"`), `loginLayout` (`"center"` / `"cover"` / `"wide"` / `"wallpaper"` / `"poster"`, plus `loginBackground`, a picture that replaces the login artwork in every layout; the `LoginLayout` enum in `@shared/model/login-layout`; the login page nav switches it, saved as `localStorage["login-layout"]`) and `menuMode` (`"normal"` / `"split"` / `"dual"` / `"top"` / `"group"` / `"top-split"`). They apply only while the user has no saved choice: `index.html` reads dark / compact / skin pre-bootstrap, `startup.service.ts` seeds the layout flags for `menuMode` without persisting them, and `WindowModel.init()` folds the legacy top-level keys (`darkTheme`, `compactTheme`, `skin`, `brutalistTheme`, `liquidGlass`, `menuMode`) into `WindowModel.theme` so the rest of the app reads one place.

- Theme less lives in `src/styles/themes/` (`dark.less`, `compact.less`, `compact-dark.less`, plus `brutalist.less`, `liquid-glass.less`, `workspace.less` and `classic.less`, the four optional skins, which ride the main bundle via styles.less; the `Skin` enum and `applySkin()` / `currentSkin()` in `@shared/util/theme.util` are the one place that knows each skin's `<html>` class and localStorage flag; the workspace skin's frame gradient presets and `applyWorkspaceFrame()` live there too, persisted as `localStorage["workspace-frame"]` holding the whole preset so `index.html` can paint the preloader). Three lazy theme bundles (angular.json `inject:false`, stable non-hashed names): `themes/dark.less` → `style.dark.css`, `themes/compact.less` → `style.compact.css`, and `themes/compact-dark.less` (dark + compact merged) → `style.compact-dark.css`. `index.html` owns the single `<link id="site-theme-style">` swapped between them via `window.eruptApplyDarkTheme(bool)` / `window.eruptApplyCompactTheme(bool)` (applied pre-bootstrap to avoid a flash; `dark-theme` localStorage supports `"auto"` = follow the OS scheme, with a live `matchMedia` listener). The `<link>` is created once pre-bootstrap and never removed (only href/disabled are swapped): it must stay BEFORE Angular's runtime-injected component `<style>` tags, otherwise a runtime theme toggle appends it last and the bundle's @delon defaults beat equal-specificity component overrides (broken reuse-tab bar, sidebar resize width, etc.) while a page refresh looks fine. **Changing angular.json bundles requires a dev-server restart** — a stale server answers the css URLs with the SPA-fallback HTML (empty stylesheet, no error).
- `src/styles/tokens.less` defines semantic `--erupt-*` color tokens on `html` (light) and `html.dark` (dark), plus dark remaps of `--ant-primary-1..3` and a block (scoped `html.dark, html.compact`) re-anchoring high-visibility ant components to the runtime `--ant-primary-*` brand color (the compiled lazy theme css uses a fixed primary), and a dark-aside block (`html.dark`) holding the ONE copy of the dark sidebar's menu states. Low-specificity re-anchors (plain `a`) live at the END of `themes/dark.less` / `themes/compact.less` instead — never add a bare `html.dark a`-style rule in tokens.less: its extra specificity beats component link styles (this once turned every sidebar menu item brand-orange).
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
