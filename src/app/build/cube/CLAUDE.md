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
  `.gridster-wrapper.screen-viewport` block, which is `cube-screen-stage.less`, a second stylesheet of the
  dashboard component: one file went over the 40 kB component style budget and failed the production build
  (`anyComponentStyle` in angular.json; a development build does not check it). It uses literal colors on purpose and follows the
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
  was tried and rejected). The editor chrome (layer panel, property panel, filter row, zoom control, rulers,
  context menu) and the filter controls on a screen are dark by literal colors kept once in
  `style/editor-chrome.less` (`@chrome-*`), which the dashboard less, `cube-screen-props.less` and the filter
  control's less import by reference; the ruler canvases read them as CSS properties (`.editor-chrome-vars()` on
  the design viewport). The frame's highlight (`@chrome-accent`) follows the accent of the screen:
  `--cube-chrome-accent`, set on the document by `syncChromeAccent()` (not on the designer's root: filter
  dropdowns and the context menu open in the overlay container, outside it). It is a CSS value, so a tint is
  `color-mix`, never `fade()`. On the stage itself the accent stays `var(--screen-accent, #22d3ee)`. `cube-puzzle-filter-control` takes
  `[dark]` and passes `cube-dark-dropdown` as the dropdown class of its select and date pickers, whose panels
  live in the overlay container and are styled by the global block at the end of the filter control's less. A
  new kind of control on the frame needs its dark dressing added there;
- a published screen shows the filter row when it has a filter that is not hidden (`hasVisibleFilter`); without one
  it shows no bar, just refresh / fullscreen on hover. The row can also be put away by hand on a screen
  (`toggleFilterBar()`, kept per dashboard in `localStorage`, not in the DSL): the eye button at its right end
  hides it, the filter button among the hover tools (published) or in the zoom control (designer) brings it back;
  `showFilterBar` is the one condition the template reads;
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
  components survive; charts whose content (not frame) changed are re-queried. The settings and the filter
  definitions ride along as `extras` (`historyExtras()`; a filter's `value` is left out, it is what the viewer
  picked): when a step brings them back they are put in place, the layout re-applied and every chart re-queried.
- unsaved edits: `beforeunload` and the route's `canDeactivate` (`canLeave()`) ask before they are lost, except in
  reuse-tab URL mode, which keeps the page. They compare the DSL at that moment with what it was when editing
  began or was last saved (`signature()`, filter values and empty objects left out); nothing polls for it.
  Ctrl / cmd + S is `saveInPlace()`: it saves and stays in the edit state (the save button saves and leaves it);
- the editor's context menu (`openStageMenu`, `#stageMenu`) opens on a report, its layer row or the empty canvas and
  acts on the selection. It is opened on a CDK overlay directly, not through `NzContextMenuService`: that service
  closes on any scroll, and a table scrolling its rows (auto scroll, or a refresh) closed the menu before it was
  placed, leaving it in the top left corner. ng-zorro wraps an item's content in `.ant-menu-title-content`, so the
  item layout is styled through `::ng-deep`; the shortcut sheet (`showShortcuts`, `?`) lists `shortcuts`, which must follow
  `onKeydown`;
- rulers (`drawRulers`, two canvases over the viewport, not on the scaled stage) follow the zoom and pan; a guide
  is pulled out of a ruler and dropped back on it to remove it. Guides are kept per dashboard in `localStorage`
  (`cube-screen-guides-{code}`), not in the DSL, and handed to moveable as guidelines (`ScreenEditor.guides`).
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
- on a data screen a KPI rolls to each new figure (`rollKpi()`, frames from `rollFrame()` in `number-format.ts`),
  from zero on first load. The frames run outside Angular and write the text node `{{ kpiText }}` renders into,
  never `textContent`, which would replace the node Angular keeps writing. Other dashboards show the figure at
  once, and so does a screen when the viewer asks for reduced motion;
- a table scrolls its rows by itself when `report.ui.autoScroll` is on (the report dialog's custom tab), at a
  fixed 30 px/s: it rests at the bottom, jumps to the top and rests, waits under the
  mouse, and carries on from where a hand scroll left it (`startAutoScroll()`, outside Angular as well). It works
  on any dashboard, not only a screen;
- the background image is uploaded from the settings dialog through the core attachment endpoint
  (`/file/upload/CubeDashboard/background`), which needs the transient `background` field declared on the
  `CubeDashboard` entity; the stored path is kept as `/erupt-attachment/...` in `settings.backgroundImage` and
  resolved by the `backgroundImage` getter, which only lets http(s) and site paths through (`safeImageSrc`);
- the layer header, the filter row and the property header are one 45px line across the editor.
- a screen's background image is stretched (`100% 100%`), not cropped: over the whole viewport in the published
  view, so no band is left around a contained stage, and over the stage in the designer. A dashboard's still
  covers.
- the global look of a screen is `settings.screen` (`ScreenSettings`, defaults in `SCREEN_DEFAULT`), edited in the
  three tabs of the settings dialog. `accent` is set as `--screen-accent` on `.puzzle-stage` and is the one color
  of the stage chrome: in the screen block of the dashboard less `@accent` is that variable, so a tint of it is
  written with `color-mix`, never `fade()`. `palette` (`model/screen-palette.ts`, with a spec) gives charts their
  series colors, a single-series chart taking the first; `ACCENT` derives tints from the accent. `headerStyle`,
  `titleSize`, `titleColor`, `logo`, `clock`, `clockFormat` shape the title bar (its height stays
  `SCREEN_HEADER_HEIGHT`); `panelTitleSize` is `--screen-panel-title` and `panelTitleColor`
  `--screen-panel-title-color` (blank = the stage's ink), `numberFont` a class on the stage, and `chartFontSize` selects a G2
  theme registered per size (`screenTheme()`); the ECharts map and the S2 pivot do not follow it yet.
