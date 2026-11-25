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

## Data screen

A dashboard created with `type = DashboardType.SCREEN` (a field of the `CubeDashboard` entity, fixed after creation;
`isScreen()` / `screenOf()` in `model/screen.util.ts`) is a data screen: a canvas at a design resolution
(`settings.screen`, defaults in `screen.util.ts`, covered by `screen.util.spec.ts`) instead of a scrolling grid. It
is the same component, DSL and routes as a dashboard; the two share the `#panel` template (one report with its
actions) and differ in what places it:

- a dashboard places panels with gridster; a screen places them absolutely by `report.frame` (`ReportFrame`, pixels
  of the design resolution, with `rotate`) inside `.screen-canvas`. The grid position stays untouched, so switching
  the mode loses neither layout; a report without a frame gets one from its grid position (`gridFrame`);
- `.puzzle-stage` has the design resolution and is scaled into the viewport by a CSS transform (`fitStage()`, on a
  `ResizeObserver`). The published view uses the screen's `fit`; the designer always contains the stage, with a
  margin, as a sheet on a desk;
- editing is `ScreenEditor` (`view/cube-puzzle-dashboard/screen-editor.ts`), a template-free wrapper of the
  `moveable` library: drag, resize, rotate and snapping of the selected report. It writes straight to the frame
  object and the element's style, the same values the template binds, and runs outside the Angular zone, so a
  drag costs no change detection. It exists only while a screen is in its edit state (`syncEditor()`); the handles
  keep their size through `zoom(1 / scale)`. In that state a report is covered (`.screen-item-edit`) so the whole
  panel is the drag surface; arrow keys nudge, delete removes;
- reports may overlap. Which one is in front is the order of `dsl.reports` (last = front), drawn as `z-index`; the
  layer panel and the front / back buttons just reorder that array. The loops track by object, not `$index`, so a
  reorder moves the components instead of swapping their inputs, and the panel template reaches its report
  component through `#rep` rather than by index;
- the backend's `ReportDSL` is a typed class: a new field on a report (like `frame`) must be added there too, or it
  is dropped on save;
- charts must take pointer events through the transform: G2Plot `supportCSSTransform`, S2
  `transformCanvasConfig → supportsCSSTransform`; a new renderer needs the equivalent;
- the published view of a screen shows no filter row and no report actions, so filter defaults are applied by
  `applyFilterDefaults()` when the DSL loads rather than by the filter controls;
- screen mode forces `DashboardTheme.DARK`; the screen chrome (header, panel styles, backdrop) lives in the
  `.gridster-wrapper.screen-viewport` block of the dashboard less, uses literal colors on purpose and follows the
  erupt-iot hall (`erupt-iot.html` in the core repo): near-black navy, hairline borders, one cyan accent,
  monospace figures. Charts take the transparent `erupt-screen` G2 theme and `SCREEN_PALETTE` from the report
  component. `ScreenPanel.NONE` draws no panel at all, for a report laid over another one.
- **widgets** are reports that show no data: `ReportType.LABEL / IMAGE / BORDER / DIVIDER / CLOCK / IFRAME / VIDEO`
  (`isWidget()`), drawn by `cube-screen-widget` instead of `cube-puzzle-report`, never queried, always without a
  panel. `model/screen-widget.ts` is the one list of them (`WIDGETS`: icon, start size, default `ui`, editable
  fields); a new widget is an entry there, a `@case` in the widget template and a `cube.widget.<TYPE>` i18n row.
  An address a widget loads goes through `safeSrc()` (http(s) or a site path only); the web page widget is a
  sandboxed iframe;
- the **property panel** (`cube-screen-props`, right side of the edit state) edits the selected report in place:
  frame, opacity and panel style (`report.ui.screen`, a `ReportScreenStyle`), and for a widget its `fields`,
  rendered generically by `PropKind`. A chart's data and chart options stay in the report dialog, opened from the
  panel. The layer panel sits on the left;
- the icons the editor uses are registered in `CubeModule`'s constructor (the app ships a fixed icon set; an
  unregistered `nzType` renders nothing);
- `tsc --noEmit` does not type-check templates: after touching one, run a throwaway
  `npx ng build --configuration development --output-path <scratch dir>`.
- change detection is coalesced into the next animation frame (`eventCoalescing`), so a `setTimeout` after a model
  change still sees the old DOM. Code that needs the element of a report it just added or moved (`selectLayer`,
  `syncEditor`, `onFrameInput`) calls `cdr.detectChanges()` first;
- the DSL of a dashboard that was never edited is empty: `ngOnInit` fills in `settings`, `reports` and `filters`
  once, so templates and "add" handlers read them without guards;
- the application's theme is left alone on a screen page (switching the whole app to dark while a screen is open
  was tried and rejected). The editor chrome (layer panel, property panel, filter row, zoom control) and the
  filter controls on a screen are dark by their own literal colors, the same `@chrome-*` values repeated in the
  dashboard less, `cube-screen-props.less` and the filter control's less. `cube-puzzle-filter-control` takes
  `[dark]` and passes `cube-dark-dropdown` as the dropdown class of its select and date pickers, whose panels
  live in the overlay container and are styled by the global block at the end of the filter control's less. A
  new kind of control on the frame needs its dark dressing added there;
- a published screen shows the filter row when it has a filter that is not hidden (`hasVisibleFilter`); without one
  it shows no bar, just refresh / fullscreen on hover;
- the designer's stage can be zoomed and panned (`view: StageView`, applied on top of the fitted transform in
  `fitStage()`; the math is `zoomAt()` in `screen.util.ts`): ctrl / cmd + wheel or a pinch zooms at the pointer, a
  plain wheel pans, and a drag pans when it starts with the middle button, with space held, or on the desk around
  the stage. The listeners are native ones on the viewport (`mousedown` captured so a pan beats a pick, `wheel`
  not passive). The published view ignores the view and always shows the stage fitted.
- several reports can be selected (`selection`; `selected` is the single one the property panel edits in full):
  shift / ctrl / cmd + click on the canvas or a layer row toggles, a drag over the empty canvas selects what its
  rectangle touches (`startMarquee`), ctrl / cmd + A selects all. A group is only moved, never resized or rotated,
  and `ScreenEditor` divides a group's drag distance by the stage scale itself: moveable reports it in display
  pixels, unlike a single target's. Alignment and distribution are `alignFrames` / `distributeFrames` in
  `screen.util.ts`; a single report aligns to the canvas;
- undo / redo is `ScreenHistory` (`model/screen-history.ts`, with a spec). It is kept by looking: a timer compares
  the reports with the last step every 300 ms and records a difference, skipping while a mouse button is down so a
  drag is one step. Nothing that changes a report has to notify it. A step is restored into the same objects, so
  components survive; charts whose content (not frame) changed are re-queried. It covers `dsl.reports` only, not
  the screen settings or filters.
- how a report behaves as an object of the screen is kept under `report.ui.screen` (`ReportScreenStyle`): `locked`
  (the canvas cannot pick it, `pointer-events: none` lets a press reach what lies below; selectable from the layer
  panel but not movable), `hidden` (`display: none` in the editor and published alike, so it is never queried) and
  `group` (reports sharing the value are selected together: `withGroups()` widens every pick, marquee and layer
  click; alt reaches a single member). Copies of a group get a group id of their own;
- ctrl / cmd + C / V / D copy, paste and duplicate the selection (`paste()`; the clipboard is a static of the
  component, so it carries from one screen to another); G groups, shift + G ungroups;
- a KPI is written by `report.ui.format` (`NumberFormat` in `model/number-format.ts`, with a spec): thousands
  separator, unit, decimals, prefix, suffix; without one the raw value is shown as before. The property panel
  edits it;
- the background image is uploaded from the settings dialog through the core attachment endpoint
  (`/file/upload/CubeDashboard/background`), which needs the transient `background` field declared on the
  `CubeDashboard` entity; the stored path is kept as `/erupt-attachment/...` in `settings.backgroundImage` and
  resolved by the `backgroundImage` getter, which only lets http(s) and site paths through (`safeImageSrc`);
- the layer header, the filter row and the property header are one 45px line across the editor.
