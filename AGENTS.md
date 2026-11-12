# AGENTS.md

This file provides guidance to coding agents (Claude Code, Codex, ...) when working with code in this repository.

## Commands

```bash
yarn install          # Install dependencies (use yarn, not npm)
yarn start            # Start dev server with proxy to backend at localhost:9999 (target in proxy.conf.js)
yarn run build        # Production build (allocates 6GB heap - large bundle); see the warning below
yarn run analyze      # Build with source maps for bundle analysis
yarn run analyze:view # View bundle analysis in browser
yarn run theme        # Regenerate theme CSS
yarn test             # Run unit tests once: `ng test --watch=false` (Vitest via @angular/build:unit-test); `npm test` is the same
yarn run test:watch   # Re-run unit tests on change
npx ng test --watch=false --include src/app/shared/util/theme.util.spec.ts   # Run a single spec file
npx tsc --noEmit -p tsconfig.app.json   # Type check (what CI runs before the tests)
```

Node.js 22+. `yarn.lock` is git-ignored, so installs resolve from `package.json`. `start` and `build` first run `scripts/fa-icons.js` (`prestart` / `prebuild`), which regenerates `src/assets/font-awesome/icons.json` from the installed Font Awesome package. CI (`.github/workflows/ci.yml`) runs the type check and `yarn test`.

Unit tests are `*.spec.ts` files next to the code they cover, run by Vitest in jsdom with globals (`describe` / `it` / `expect` / `vi`). They cover plain classes, services and utils only: schema / search-condition conversion, theme resolution, coordinate conversion, flow graph helpers, approval-flow state. No spec uses `TestBed` or renders a component: the components are declared in NgModules with external templates and are deliberately left out, so logic worth testing is kept in (or split into) a template-free class that a spec constructs with stubbed dependencies, e.g. `FlowModelState` under `src/app/build/erupt/components/flow-model/`, which `FlowModelComponent` extends and `flow-model.state.spec.ts` covers. The test build runs in memory and never writes to the build `outputPath`.

**Do not run `yarn run build` / `ng build` to verify changes.** `angular.json` sets `outputPath.base` to an absolute path inside the backend repo (`.../erupt/erupt-web/src/main/resources/public`), so every build with the default options (including `--configuration development`) overwrites the committed production bundle there. Verify with `npx tsc --noEmit -p tsconfig.app.json` and `npx lessc --js <file>.less` instead; the user builds themselves. If a throwaway build is really needed, send it elsewhere: `npx ng build --output-path /tmp/erupt-web-build`.

## Code Style

- All code comments must be written in **English**.
- Prefer TypeScript `enum`s over string-literal union types for closed sets of values (menu types, modes, statuses, field types…). Put them next to the model they describe (e.g. `MenuMode` / `MenuTypeEnum` in `@shared/model/erupt-menu`), expose them to templates via a `readonly X = X` field, and never compare against raw string literals in `.ts` or `.html`.

## Architecture Overview

This is an **Angular 21 enterprise admin framework** (`erupt-web`) that auto-generates UI/forms from JSON schema definitions provided by a Java backend. The philosophy is "zero frontend code" — UI is driven entirely by schema.

### Backend Integration

The Angular app communicates with an Erupt Java backend. In development, `proxy.conf.js` proxies all `/erupt-api`, `/erupt-attachment`, `/erupt-websocket`, and other backend paths to `http://localhost:9999`. The production build outputs to the Java project's `src/main/resources/public` directory (configured in `angular.json`).

**Backend source location:** the core Erupt Java backend lives in the sibling directory `../erupt` (i.e. `/Users/yp.li/code/erupt`). Key modules there: `erupt-annotation` (the `@Erupt`/`@EruptField`/`@Edit`/`@View`/`@Vis` annotation definitions that drive every schema), `erupt-core` (model registry, build pipeline), `erupt-web` build output target, and `erupt-designer` (the form-designer backend powering `src/app/build/designer/`). Feature modules `cube` and `flow` have their own backends in separate sibling dirs — see their local `AGENTS.md` files. When the frontend mirrors an annotation structure (e.g. the designer's `DesignerForm`), the source of truth is `../erupt/erupt-annotation`.

### Module Structure

Traditional Angular modules (not standalone), lazy-loaded:

- `src/app/core/` — Singleton services: startup initialization (`APP_INITIALIZER`), HTTP interceptors (auth token injection), i18n
- `src/app/shared/` — Shared module: reusable components, pipes (safe-html, i18n), directives, services
- `src/app/layout/` — Layout shells: `erupt/` (main dashboard), `passport/` (login), `blank/`
- `src/app/routes/` — Top-level page components (home, profile, MFA, password reset, embedded site, exception pages) and the route tables: `routes-routing.module.ts` (shells) and `core.routes.ts` (the feature routes)
- `src/app/build/` — Lazy-loaded feature modules:
  - `erupt/` — Core CRUD module: auto-renders tables, forms, and trees from schema
  - `cube/` — OLAP/BI cube queries and drill-downs
  - `bi/` — Dashboard builder with gridster grid layout
  - `flow/` — Workflow builder and approval pages
  - `designer/` — Form designer for `@Erupt` models
  - `ai/`, `ai-dev/` — AI features; AI software delivery (erupt-ai-dev)
  - `tpl/` — Custom template rendering
  - `monitor/`, `terminal/`, `file-center/`, `module-center/`, `remote/` — pages of the backend plugins of the same name
  - `share/` — public share links

### Schema-Driven UI (Core Concept)

The most important pattern to understand: `DataService` fetches JSON schema from the backend describing data models (fields, types, validations, relations). `UIBuildService` (`src/app/build/erupt/service/ui-build.service.ts`) translates that schema into Angular component configurations. `DataHandlerService` handles form data transformations. All CRUD form fields are in `src/app/build/erupt/components/` (date, choice, search, reference, tree-select, etc.).

### Routing

Hash-based routing. Feature modules are lazy-loaded:
- `/build/*` → erupt CRUD
- `/cube/*` → OLAP cubes
- `/bi/:name/*` → dashboards
- `/flow/*`, `/designer/*`, `/ai/*`, `/ai-dev/*`, `/monitor/*`, `/terminal/*`, `/file-center/*`, `/module-center/*`, `/remote/:id/*`, `/tpl/:name/*`

The same feature routes (`coreRouter` in `core.routes.ts`) are mounted twice: under the main layout and under `/fill/*`, which renders a page full-screen without the layout (drawers embed pages this way, e.g. `/#/fill/flow/approval-detail/<no>`). `/share/*` is public: no layout and no login.

### Approval Flows in the CRUD Views

erupt-flow can take over a model's add / edit / delete and apply it once approved. Everything a record-listing view needs for that sits in one shared component, `erupt-flow-model` (`src/app/build/erupt/components/flow-model/`), used by the table view (`view/table`) and the tree view (`view/tree`) through `<erupt-flow-model #flow>`:

- `FlowModelState` (`flow-model.state.ts`) is the template-free part: `load()` asks the server whether the model runs through flows (a model need not carry the `EruptFlow` tag; the flow configs bound to it decide, and nothing is asked when the app has no `erupt-flow` property), `refresh()` reads the current user's changes still pending, `loadMarks(ids)` reads the flow marks of the records on screen (the records themselves carry no flow fields), `pickNeeded()` / `chooseFlow()` / `pickedHeader()` handle choosing among several flows and the people of self-select nodes, and `submitted(res)` recognizes the `Status.INFO` answer of an operation a flow took over (nothing changed yet).
- `FlowModelComponent` extends it with the UI: the `actions` template the host renders among its toolbar buttons ("pending approval", "approval settings"), the drawers, and `header(action)`, which the host awaits before sending an add / edit / delete and whose result goes into the request headers (`null` = cancelled). It emits `ready` when a model turns out to run through flows and `changed` when the host should re-read its data.

A new view that lists records reuses this component instead of calling the flow endpoints itself.

### Operation Column Width (table view)

`table.component.ts` sizes the operation column by the rows on screen (`operatorWidth()` / `fitOperatorColumn()`): it takes the most buttons any row of the page shows, so a button its `iif` hides on every row (a custom operation's condition, a row power, a flow mark) takes no room while a disabled one keeps its place. The width only grows while the table stays open, a `tableOperatorWidth` set on the model is left alone, and a change remounts the table (`remountTable()`, carrying the header sort state over) because nz-table keeps the auto widths it measured for the other columns. A new row button therefore only needs a correct `iif`; do not hand-tune the column width.

### i18n

UI strings live in `src/erupt.i18n.csv` (columns `key,zh-CN,zh-TW,en-US,fr-FR,ja-JP,ko-KR,ru-RU,es-ES,de-DE,pt-PT,id-ID,ar-SA`), loaded at runtime by `src/app/core/i18n/i18n.service.ts`. Templates use `{{ 'key' | translate }}`, code uses `I18NService.fanyi('key')`; a new key gets a value in every column.

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

The app supports a runtime dark theme (settings drawer → night mode switch, persisted as `localStorage["dark-theme"]`, default via `eruptSiteConfig.darkTheme` = `true` / `false` / `"auto"`). Appearance defaults live in `eruptSiteConfig.theme` (`src/app.js`): `customizable` (default `true`; `false` hides the branding controls, i.e. theme color / header color / skin / navigation gradient / menu mode, in the settings drawer / sidebar / login page / home page, makes `index.html` purge those saved user keys on load and makes `startup.service` force `menuMode`; light/dark and compact stay user-switchable), `primaryColor`, `headerColor`, `dark` (`true` / `false` / `"auto"`), `compact`, `skin` (`"default"` / `"brutalist"` / `"liquid-glass"` / `"workspace"` / `"classic"` / `"terminal"` / `"material"` / `"polaris"` / `"linear"`), `loginLayout` (`"center"` / `"cover"` / `"wide"` / `"wallpaper"` / `"poster"`, plus `loginBackground`, a picture that replaces the login artwork in every layout; the `LoginLayout` enum in `@shared/model/login-layout`; the login page nav switches it, saved as `localStorage["login-layout"]`) and `menuMode` (`"normal"` / `"split"` / `"dual"` / `"top"` / `"group"` / `"top-split"`). They apply only while the user has no saved choice: `index.html` reads dark / compact / skin pre-bootstrap, `startup.service.ts` seeds the layout flags for `menuMode` without persisting them, and `WindowModel.init()` folds the legacy top-level keys (`darkTheme`, `compactTheme`, `skin`, `brutalistTheme`, `liquidGlass`, `menuMode`) into `WindowModel.theme` so the rest of the app reads one place.

- Theme less lives in `src/styles/themes/` (`dark.less`, `compact.less`, `compact-dark.less`, plus `brutalist.less`, `liquid-glass.less`, `workspace.less`, `classic.less`, `material.less` (Material 3 / Gmail: brand-tinted tonal chrome via `color-mix` on the primary color, bright 16px-rounded sheet flush to header and sidebar, pill rows and buttons, 28px dialogs), `polaris.less` (Shopify admin: near-black bar whose color the shell paints behind the rounded top corners of the gray menu column and the page, white chip current row, ink beveled primary button independent of the theme color, 8px controls / 12px surfaces), `linear.less` (Linear / Vercel: bar, menu column and canvas are one surface divided by 1px hairlines, a faint neutral fill for the current row, dense 13px rows, 6px controls, no shadows on the page; the dark variant puts a cool near-black canvas under the compiled dark containers) and `terminal.less` (phosphor console: black canvas, monospace, dashed rules, inverse-video selection; its light variant darkens the accent to `--ant-primary-9`), the eight optional skins, which ride the main bundle via styles.less; skins that need a palette of their own (brutalist pastels, terminal phosphors, polaris ink: default `#303030`, lifted toward white in its dark variant) are registered in `SKIN_PALETTES` in theme.util with their own `theme-color-<skin>` storage slot, default color and presets, and `headerColorLocked()` hides the header color picker for skins whose bar is part of their language; the `Skin` enum and `applySkin()` / `currentSkin()` in `@shared/util/theme.util` are the one place that knows each skin's `<html>` class and localStorage flag; the workspace skin's frame gradient presets and `applyWorkspaceFrame()` live there too, persisted as `localStorage["workspace-frame"]` holding the whole preset so `index.html` can paint the preloader; picking a preset in the settings drawer also sets the theme color to the preset's `accent` so frame and controls share a palette). Three lazy theme bundles (angular.json `inject:false`, stable non-hashed names): `themes/dark.less` → `style.dark.css`, `themes/compact.less` → `style.compact.css`, and `themes/compact-dark.less` (dark + compact merged) → `style.compact-dark.css`. `index.html` owns the single `<link id="site-theme-style">` swapped between them via `window.eruptApplyDarkTheme(bool)` / `window.eruptApplyCompactTheme(bool)` (applied pre-bootstrap to avoid a flash; `dark-theme` localStorage supports `"auto"` = follow the OS scheme, with a live `matchMedia` listener). The `<link>` is created once pre-bootstrap and never removed (only href/disabled are swapped): it must stay BEFORE Angular's runtime-injected component `<style>` tags, otherwise a runtime theme toggle appends it last and the bundle's @delon defaults beat equal-specificity component overrides (broken reuse-tab bar, sidebar resize width, etc.) while a page refresh looks fine. **Changing angular.json bundles requires a dev-server restart** — a stale server answers the css URLs with the SPA-fallback HTML (empty stylesheet, no error).
- `src/styles/tokens.less` defines semantic `--erupt-*` color tokens on `html` (light) and `html.dark` (dark), plus dark remaps of `--ant-primary-1..3` and a block (scoped `html.dark, html.compact`) re-anchoring high-visibility ant components to the runtime `--ant-primary-*` brand color (the compiled lazy theme css uses a fixed primary), and a dark-aside block (`html.dark`) holding the ONE copy of the dark sidebar's menu states. Low-specificity re-anchors (plain `a`) live at the END of `themes/dark.less` / `themes/compact.less` instead — never add a bare `html.dark a`-style rule in tokens.less: its extra specificity beats component link styles (this once turned every sidebar menu item brand-orange).
- `<meta name="theme-color">` and the PWA manifest are branded pre-bootstrap in `index.html`: `window.eruptSyncThemeColor()` is the only writer of the two metas (light / dark defaults, swapped for the painted `.erupt-header` background): called pre-bootstrap, from `applyHeaderColor()` on every bar change, header `ngAfterViewInit` / `ngOnDestroy`, passport `ngAfterViewInit` and the dark toggle; with no bar it takes the login page's `.lp-side-nav` or the preloader, and it darkens the color by any modal / drawer mask covering the top strip, re-run from a MutationObserver on the CDK overlay container, so the corners Chrome paints around the window controls dim with the bar; it composites the bar over its ancestors' backgrounds, since a skin may leave it transparent or translucent, and also writes the un-masked result to `--erupt-titlebar-color` on `<html>`, which `pwa.less` paints flat across the header, and window-wide behind the login nav, in overlay mode so bar and corners read as one strip even over a gradient frame or the login picture) so skins and the async ng-zorro palette cannot leave the meta stale; `window.eruptApplyManifest(cfg)` re-issues `manifest.json` as a `blob:` URL (relative URLs made absolute): `name` / `short_name` from `logoText` / `title`, `description` from `desc`, `theme_color` from `headerColor` / `primaryColor`, and from `eruptSiteConfig.pwa` the `icon` (one image: SVG as `sizes: any`, a raster measured via `Image` for its real `sizes`) and `shortcuts` (manifest shape, `icon` shorthand). `manifest.json` itself stays the unbranded static default; its `display_override` leads with `window-controls-overlay`, and `src/styles/pwa.less` makes `.erupt-header` (the header host is `<layout-header class="erupt-header">`, not delon's `.alain-default__header`) and the login page's top nav the draggable title bar; the header's overlay padding from `env(titlebar-area-*)` sits in `erupt.component.less` next to its base padding; `installModalDragClamp()` in `@shared/util/pwa.util` (called from `app.component`) keeps a draggable nz-modal from being dragged under the window controls via a compensating margin-top, since CDK's drag boundary is the whole overlay container.
- The menu column's right edge is drawn in ONE place: `.alain-default__aside::after` in `erupt.component.less`, raised above the opaque bottom utility bar (`.fold`) and the loading overlay, styled by the `--erupt-aside-edge` token (tokens.less, default `1px solid var(--ant-border-color-split)`). A skin sets that token (`none`, terminal's dashed rule, brutalist's 2px ink) and never gives `.fold` a `border-right` or restyles the pseudo-element. The dual-menu rail's right rule is an inner divider and stays its own.
- Theme color and header color are user-configurable in the settings drawer: `localStorage["theme-color"]` (primary palette via NzConfigService) and `localStorage["header-color"]` (`"primary"` or a literal color; `resolveHeaderColor()` in `@shared/util/theme.util` is the one resolver, and pins the brutalist skin to `"primary"` with its picker hidden; `applyHeaderColor()` sets `--erupt-header-*` inline on `<html>`, with luminance-based foreground). Header styles must use the `--erupt-header-*` tokens, not `--erupt-text`/`--erupt-bg-container`.
- **Never hard-code light-theme colors in less files** (`#fff` surfaces, black-based text, light borders/fills). Use the tokens with the original value as fallback, e.g. `background: var(--erupt-bg-container, #fff)`. Colors on brand/colored/intentionally-dark surfaces (white text on primary buttons, node card headers, terminal) stay literal. Charts/editors follow `document.documentElement.classList.contains('dark')` (see bi chart, cube report, code-editor, markdown components).

### Maps

`EditType.MAP` (`components/map-edit`) and the map view (`vis/map`) never touch a vendor SDK directly. They call `MapService` (`@shared/service/map/map.service`), which picks the adapter for `eruptSiteConfig.map.provider` (`MapProvider` enum in `@shared/model/map.model`: `amap` / `baidu` / `tencent` / `tianditu` / `google` / `osm`; `tianditu` and `osm` ride one Leaflet adapter) via a dynamic `import()`, and the adapter loads the vendor SDK from its CDN at runtime, so nothing map-related is bundled. Every adapter implements the `EruptMap` interface (markers with an svg pin shared through `sdk.util`, clustering, info window, click, place search, reverse geocoding); add a vendor by adding one adapter file and one `ADAPTERS` entry. Stored locations are `{id?, name, address, lng, lat}` JSON; `toMapPlace()` also reads the raw AMap tips older versions stored.

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
