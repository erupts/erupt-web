import {ChangeDetectorRef, Component, ElementRef, HostListener, Inject, Input, NgZone, OnDestroy, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren, inject} from '@angular/core';
import {ClipboardService} from '@shared/service/clipboard.service';
import {ActivatedRoute, Router} from '@angular/router';
import {GridsterConfig} from "angular-gridster2";
import {CubeApiService} from "../../service/cube-api.service";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {I18NService, setReuseTabTitle} from '@core';
import {ReuseTabService} from '@delon/abc/reuse-tab';
import {MenuService} from "@delon/theme";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {CubePuzzleReportConfig} from "../cube-puzzle-report-config/cube-puzzle-report-config";
import {
    Dashboard,
    DashboardDSL,
    DashboardPublishHistory,
    DashboardTheme,
    FilterDSL,
    isWidget,
    parseRelativeDefault,
    ReportDSL,
    ReportScreenStyle,
    ReportType,
    ScreenFit,
    ScreenPanel,
    ScreenSettings
} from "../../model/dashboard.model";
import {newWidget, WidgetDef, widgetDef, WIDGETS} from "../../model/screen-widget";
import {ScreenHistory} from "../../model/screen-history";
import {RestPath} from "../../../erupt/model/erupt.enum";
import {
    AlignKind, alignFrames, Axis, boundsOf, Box, distributeFrames,
    canvasHeight, gridFrame, isScreen, safeImageSrc, SCREEN_DEFAULT, screenOf, ScreenTransform, screenTransform, STAGE_VIEW_FIT,
    StageView, zoomAt
} from "../../model/screen.util";
import {ScreenEditor} from "./screen-editor";
import {BaseField, CubeMeta, FieldType} from "../../model/cube.model";
import {cloneDeep} from "lodash";
import {CubePuzzleReport} from "../cube-puzzle-report/cube-puzzle-report";
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {CubeOperator} from "../../model/cube-query.model";
import {CubePuzzleFilterConfig} from "../cube-puzzle-filter-config/cube-puzzle-filter-config";
import {deepCopy} from "@delon/util";
import {CubePuzzleDashboardConfig} from "../cube-puzzle-dashboard-config/cube-puzzle-dashboard-config";
import {CubePuzzleSubModelConfig} from "../cube-puzzle-sub-model-config/cube-puzzle-sub-model-config";
import {NzDrawerRef, NzDrawerService} from "ng-zorro-antd/drawer";
import {AiChatComponent} from "../../../ai/view/ai-chat/ai-chat.component";
import {AI_ICON} from "@shared/util/ai-icon";

@Component({
    standalone: false,
    selector: 'cube-puzzle-dashboard',
    templateUrl: './cube-puzzle-dashboard.component.html',
    styleUrls: ['./cube-puzzle-dashboard.component.less']
})
export class CubePuzzleDashboardComponent implements OnInit, OnDestroy {

    private clipboard = inject(ClipboardService);

    @Input() editModel: boolean = true;

    options: GridsterConfig;

    edit = false;

    code!: string;

    saving: boolean = false;

    publishing: boolean = false;

    dashboard: Dashboard;

    cubeMeta: CubeMeta;

    tempDsl: DashboardDSL;

    dsl: DashboardDSL;

    isFullscreen = false;

    autoRefreshTimer: any;

    showAiPanel: boolean = false;

    aiPanelWidth: number = 420;

    aiContext: string = '';

    aiResizing: boolean = false;

    private _aiResizeCleanup: (() => void) | null = null;

    @ViewChildren(CubePuzzleReport) reports: QueryList<CubePuzzleReport>;
    @ViewChild('publishContent', {static: true}) publishContent: TemplateRef<any>;
    @ViewChild('historyContent', {static: true}) historyContent: TemplateRef<any>;

    charts: any[] = [];

    /** Set while the dashboard is a data screen: its settings with the defaults filled in */
    screen: Required<ScreenSettings> | null = null;

    /** Places the stage of a data screen (design resolution) into the viewport */
    stageTransform: string | null = null;

    /** The reports selected on the canvas of a screen being edited */
    selection: ReportDSL[] = [];

    /** The one selected report, which the property panel edits; null when none or several are selected */
    get selected(): ReportDSL | null {
        return this.selection.length === 1 ? this.selection[0] : null;
    }

    isSelected(report: ReportDSL): boolean {
        return this.selection.includes(report);
    }

    /** The rectangle being dragged over the canvas to select what it touches, in canvas pixels */
    marquee: Box | null = null;

    /** Undo and redo of the edit state of a screen */
    history: ScreenHistory | null = null;

    private historyTimer: any;

    private pointerDown = false;

    /** Drag, resize and rotate of the selected report; exists only while a screen is being edited */
    private editor: ScreenEditor | null = null;

    private scale = 1;

    @ViewChild('canvas') private canvasRef: ElementRef<HTMLElement>;

    now = new Date();

    private clockTimer: any;

    private viewportEl: HTMLElement;

    private viewportObserver: ResizeObserver;

    @ViewChild('viewport') set viewport(ref: ElementRef<HTMLElement>) {
        // the query hands over the same element again and again: wire it once
        if (ref?.nativeElement === this.viewportEl) return;
        this.viewportObserver?.disconnect();
        this.viewportEl = ref?.nativeElement;
        if (this.viewportEl) {
            this.viewportObserver = new ResizeObserver(() => this.zone.run(() => this.fitStage()));
            this.viewportObserver.observe(this.viewportEl);
            // captured, so a pan that starts on a report is not taken for a pick of that report;
            // not passive, so a wheel zooms the stage instead of the browser page
            this.viewportEl.addEventListener('mousedown', e => this.onStageMouseDown(e), {capture: true});
            this.viewportEl.addEventListener('wheel', e => this.onStageWheel(e), {passive: false});
        }
    }

    private gridsterApi: any;

    constructor(private router: Router, private route: ActivatedRoute,
                private cubeApiService: CubeApiService,
                private el: ElementRef,
                private message: NzMessageService,
                @Inject(NzModalService) private modal: NzModalService,
                private drawerService: NzDrawerService,
                private i18n: I18NService,
                private menuSrv: MenuService,
                private reuseTab: ReuseTabService,
                private zone: NgZone,
                private cdr: ChangeDetectorRef
    ) {

    }

    ngOnInit() {
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
        });
        document.addEventListener('webkitfullscreenchange', () => {
            this.isFullscreen = !!document['webkitFullscreenElement'];
        });
        document.addEventListener('mozfullscreenchange', () => {
            this.isFullscreen = !!document['mozFullScreenElement'];
        });
        document.addEventListener('msfullscreenchange', () => {
            this.isFullscreen = !!document['msFullscreenElement'];
        });
        this.options = {
            gridType: 'scrollVertical',
            compactType: 'compactUp',
            margin: 12,
            outerMargin: true,
            outerMarginTop: null,
            outerMarginRight: null,
            outerMarginBottom: null,
            outerMarginLeft: null,
            useTransformPositioning: true,
            mobileBreakpoint: 640,
            minCols: 1,
            maxCols: 24,
            minRows: 1,
            maxRows: 10000,
            maxItemCols: 24,
            minItemCols: 1,
            maxItemRows: 100,
            minItemRows: 1,
            maxItemArea: 2500,
            minItemArea: 1,
            defaultItemCols: 1,
            defaultItemRows: 1,
            fixedColWidth: 105,
            fixedRowHeight: 80,
            keepFixedHeightInMobile: false,
            keepFixedWidthInMobile: false,
            scrollSensitivity: 10,
            scrollSpeed: 20,
            enableEmptyCellClick: false,
            enableEmptyCellContextMenu: false,
            enableEmptyCellDrop: false,
            enableEmptyCellDrag: false,
            emptyCellDragMaxCols: 50,
            emptyCellDragMaxRows: 50,
            ignoreMarginInRow: false,
            draggable: {
                enabled: this.edit,
                ignoreContent: true,
                ignoreContentClass: 'gridster-item-content',
                dragHandleClass: 'drag-handler',
                dropOverItems: false,
            },
            resizable: {
                enabled: this.edit
            },
            swap: false,
            pushItems: true,
            disablePushOnDrag: false,
            disablePushOnResize: false,
            pushResizeItems: false,
            displayGrid: 'onDrag&Resize',
            disableWindowResize: false,
            disableWarnings: false,
            scrollToNewItems: false,
            initCallback: (_gridster: any, api: any) => {
                this.gridsterApi = api;
            }
        };
        this.code = this.route.snapshot.paramMap.get('code')!;
        const savedAi = localStorage.getItem(`cube-ai-panel-${this.code}`);
        if (savedAi) {
            try {
                const s = JSON.parse(savedAi);
                // On phones the AI chat opens in a drawer, so never restore the inline side panel.
                if (s.open && window.innerWidth > 768) this.showAiPanel = true;
                if (s.width) this.aiPanelWidth = s.width;
            } catch {}
        }
        this.cubeApiService.dashboardDetail(this.code).subscribe(res => {
            this.dashboard = res.data;
            // The designer (/cube/puzzle/:code) has no menu entry: show the dashboard name on the tab
            setReuseTabTitle(this.reuseTab, this.route, res.data.name);
            // A dashboard that was never edited has an empty DSL, or none: give it the parts everything
            // below reads, so neither the template nor an "add" has to ask whether they exist
            this.dsl = (this.editModel ? res.data.draftDsl : res.data.publishDsl) || {};
            this.dsl.settings ??= {};
            this.dsl.reports ??= [];
            this.dsl.filters ??= [];
            this.applyLayout();
            // restore filter conditions from URL
            const urlFilters = this.route.snapshot.queryParams['filters'];
            if (urlFilters) {
                try {
                    const filterValues: Record<string, any> = JSON.parse(urlFilters);
                    for (const f of (this.dsl?.filters || [])) {
                        if (filterValues[f.field] !== undefined) {
                            let val = filterValues[f.field];
                            if (f.operator === CubeOperator.BETWEEN && Array.isArray(val)) {
                                val = val.map((v: any) => (typeof v === 'string' && v) ? new Date(v) : v);
                            }
                            f.value = val;
                        }
                    }
                } catch (e) {}
            }
            // A data screen shows no filter controls, which are what otherwise fills in the defaults
            this.applyFilterDefaults();
            this.cubeApiService.cubeMetadata(this.dashboard.cuber, this.dashboard.explore, this.dashboard.source).subscribe(res => {
                const meta = res.data;
                const fieldTitleMap = new Map<string, string>();
                const fieldMap = new Map<string, BaseField>();
                meta.dimensions?.forEach(it => {
                    fieldTitleMap.set(it.code, it.title);
                    fieldMap.set(it.code, it);
                });
                meta.measures?.forEach(it => {
                    fieldTitleMap.set(it.code, it.title);
                    fieldMap.set(it.code, it);
                });
                meta.parameters?.forEach(it => {
                    fieldTitleMap.set(it.code, it.title);
                    fieldMap.set(it.code, it);
                });
                meta.fieldTitleMap = fieldTitleMap;
                meta.fieldMap = fieldMap;
                this.cubeMeta = meta;
                this.buildAiContext();
            })
            this.initAutoRefresh();
        })
    }

    private isEmptyValue(v: any): boolean {
        return v === null || v === undefined || v === ''
            || (Array.isArray(v) && v.every(i => i === null || i === undefined));
    }

    /** Gives every filter without a value its default one */
    private applyFilterDefaults() {
        for (const filter of this.dsl?.filters || []) {
            if (this.isEmptyValue(filter.value)) {
                const rd = parseRelativeDefault(filter.defaultValue);
                if (rd && filter.operator === CubeOperator.BETWEEN) {
                    filter.value = this.computeRelativeDateRange(rd);
                } else if (!this.isEmptyValue(filter.defaultValue)) {
                    filter.value = filter.defaultValue;
                }
            }
        }
    }

    /**
     * Applies the mode the settings ask for. A dashboard is a scrolling gridster page. A data screen is a
     * canvas of the design resolution, scaled as a whole (fitStage), on which every report has a frame in
     * pixels and may overlap the others; a report without one gets it from its place on the grid.
     */
    private applyLayout() {
        this.screen = screenOf(this.dashboard, this.dsl);
        const gap = this.dsl?.settings?.gap ?? 12;
        this.options = {...this.options, margin: gap};
        this.ensureFrames();
        this.fitStage();
        clearInterval(this.clockTimer);
        this.clockTimer = this.screen?.header && this.screen.clock ? setInterval(() => this.now = new Date(), 1000) : null;
        this.syncEditor();
    }

    /** On a screen every report needs a frame, which the canvas binds without asking */
    private ensureFrames() {
        if (this.screen) {
            for (const report of this.dsl.reports || []) {
                report.frame ??= gridFrame(report, this.screen, this.dsl.settings?.gap ?? 12);
            }
        }
    }

    /** Creates the editor when a screen enters its edit state and drops it when it leaves */
    private syncEditor() {
        this.editor?.destroy();
        this.editor = null;
        this.selection = [];
        if (this.screen && this.edit) {
            // the canvas appears, or changes its size, with the view: bring it up to date first.
            // (Change detection is coalesced into the next frame, so a timeout would come too early.)
            this.cdr.detectChanges();
            const canvas = this.canvasRef?.nativeElement;
            if (canvas) {
                this.editor = this.zone.runOutsideAngular(
                    () => new ScreenEditor(canvas, this.screen.width, canvasHeight(this.screen)));
                this.editor.zoom(this.scale);
            }
        }
    }

    /** Hands the selection to the editor; the mouse event that made it, if any, goes on as a drag */
    private applySelection(event?: MouseEvent) {
        if (!this.editor) return;
        // a report may have been added a moment ago: its element exists once the view is up to date
        this.cdr.detectChanges();
        const items = this.canvasRef.nativeElement.querySelectorAll<HTMLElement>(':scope > .screen-item');
        const els = this.selection.map(it => items[this.dsl.reports.indexOf(it)]);
        if (els.length && els.every(it => it)) {
            // a locked report can be selected from the layer panel, to unlock it or edit it, but not moved
            const movable = !this.selection.some(it => this.isLocked(it));
            this.zone.runOutsideAngular(() =>
                this.editor.select(els, this.selection.map(it => it.frame), movable, movable ? event : undefined));
        } else {
            this.selection = [];
            this.editor.clear();
        }
    }

    /** With shift, ctrl or cmd held a click adds to the selection, or takes away from it */
    private toggles(event?: MouseEvent): boolean {
        return !!event && (event.shiftKey || event.ctrlKey || event.metaKey);
    }

    private toggle(report: ReportDSL, single: boolean) {
        const members = single ? [report] : this.withGroups([report]);
        this.selection = this.isSelected(report)
            ? this.selection.filter(it => !members.includes(it))
            : [...this.selection, ...members.filter(it => !this.isSelected(it))];
    }

    // ── how a report behaves as an object of the screen: locked, hidden, grouped (report.ui.screen) ──

    private styleOf(report: ReportDSL): ReportScreenStyle {
        return report.ui?.['screen'] || {};
    }

    private setStyle(report: ReportDSL, part: ReportScreenStyle) {
        report.ui ??= {};
        report.ui['screen'] = {...report.ui['screen'], ...part};
    }

    isLocked(report: ReportDSL): boolean {
        return !!this.styleOf(report).locked;
    }

    isHidden(report: ReportDSL): boolean {
        return !!this.styleOf(report).hidden;
    }

    isGrouped(report: ReportDSL): boolean {
        return !!this.styleOf(report).group;
    }

    toggleLock(report: ReportDSL, event: MouseEvent) {
        event.stopPropagation();
        this.setStyle(report, {locked: !this.isLocked(report)});
        this.applySelection();
    }

    toggleHidden(report: ReportDSL, event: MouseEvent) {
        event.stopPropagation();
        this.setStyle(report, {hidden: !this.isHidden(report)});
        this.applySelection();
    }

    /** The reports with everyone they are grouped with, in layer order */
    private withGroups(reports: ReportDSL[]): ReportDSL[] {
        const groups = new Set(reports.map(it => this.styleOf(it).group).filter(it => it));
        return this.dsl.reports.filter(it => reports.includes(it) || groups.has(this.styleOf(it).group));
    }

    /** Makes the selection one group: from now on its members are selected, and so moved, together */
    group() {
        if (this.selection.length < 2) return;
        const group = 'g' + Date.now().toString(36);
        this.selection.forEach(it => this.setStyle(it, {group}));
    }

    ungroup() {
        this.selection.forEach(it => this.setStyle(it, {group: undefined}));
    }

    get canUngroup(): boolean {
        return this.selection.some(it => this.isGrouped(it));
    }

    // ── copy and paste ──

    /** What was copied, kept for the page's lifetime so it can be pasted into another screen too */
    private static clipboard: ReportDSL[] = [];

    copySelection() {
        if (this.selection.length) {
            CubePuzzleDashboardComponent.clipboard = cloneDeep(this.selection);
        }
    }

    /** Adds copies of the given reports, a little down and to the right, and selects them */
    paste(source: ReportDSL[] = CubePuzzleDashboardComponent.clipboard) {
        if (!source.length) return;
        const copies: ReportDSL[] = cloneDeep(source);
        // the copies of a group are a group of their own, not more members of the original
        const groups = new Map<string, string>();
        copies.forEach((it, i) => {
            if (it.frame) {
                it.frame.x += 24;
                it.frame.y += 24;
            }
            const group = this.styleOf(it).group;
            if (group) {
                if (!groups.has(group)) groups.set(group, 'g' + Date.now().toString(36) + i);
                this.setStyle(it, {group: groups.get(group)});
            }
        });
        this.dsl.reports.push(...copies);
        this.ensureFrames();
        this.selection = copies;
        this.applySelection();
    }


    /** A report was pressed on the canvas: select it, and let the same press drag what is selected */
    pick(report: ReportDSL, event: MouseEvent) {
        if (!this.editor) return;
        event.stopPropagation();
        // the press is a drag, not the start of a text selection
        event.preventDefault();
        // alt reaches one member of a group on its own
        if (this.toggles(event)) {
            this.toggle(report, event.altKey);
            this.applySelection();
        } else {
            if (!this.isSelected(report)) {
                this.selection = event.altKey ? [report] : this.withGroups([report]);
            }
            this.applySelection(event);
        }
    }

    /** A press on the empty canvas: a click clears the selection, a drag selects the reports its rectangle touches */
    startMarquee(event: MouseEvent) {
        if (!this.editor || event.button !== 0) return;
        const box = this.canvasRef.nativeElement.getBoundingClientRect();
        const at = (e: MouseEvent) => ({x: (e.clientX - box.left) / this.scale, y: (e.clientY - box.top) / this.scale});
        const from = at(event);
        const move = (e: MouseEvent) => this.zone.run(() => {
            const to = at(e);
            this.marquee = {
                x: Math.min(from.x, to.x), y: Math.min(from.y, to.y),
                width: Math.abs(to.x - from.x), height: Math.abs(to.y - from.y)
            };
        });
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            this.zone.run(() => {
                const m = this.marquee;
                this.marquee = null;
                this.selection = m && (m.width > 3 || m.height > 3)
                    ? this.withGroups(this.dsl.reports.filter(it => this.pickable(it)).filter(({frame: f}) =>
                        f.x < m.x + m.width && f.x + f.width > m.x && f.y < m.y + m.height && f.y + f.height > m.y))
                    : [];
                this.applySelection();
            });
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    }

    /** What the canvas itself can select: a locked or hidden report is reached from the layer panel only */
    private pickable(report: ReportDSL): boolean {
        return !this.isLocked(report) && !this.isHidden(report);
    }

    selectAll() {
        this.selection = this.dsl.reports.filter(it => this.pickable(it));
        this.applySelection();
    }

    /** Aligns the selection: several reports to one another, a single one to the canvas */
    align(kind: AlignKind) {
        const frames = this.selection.map(it => it.frame);
        const box = frames.length > 1 ? boundsOf(frames)
            : {x: 0, y: 0, width: this.screen.width, height: canvasHeight(this.screen)};
        alignFrames(frames, kind, box);
        this.onFrameInput();
    }

    distribute(axis: Axis) {
        distributeFrames(this.selection.map(it => it.frame), axis);
        this.onFrameInput();
    }

    /**
     * History is kept by looking: every so often the reports are compared with the last step, and a
     * difference becomes a step. Nothing that changes a report has to say so. A gesture in progress is
     * left alone, so a drag is one step however long it takes.
     */
    private watchHistory() {
        clearInterval(this.historyTimer);
        this.history = this.screen && this.edit ? new ScreenHistory(this.dsl.reports) : null;
        if (this.history) {
            this.zone.runOutsideAngular(() => this.historyTimer = setInterval(() => {
                if (!this.pointerDown && this.history?.commit(this.dsl.reports)) {
                    // the undo button just became usable
                    this.zone.run(() => this.cdr.markForCheck());
                }
            }, 300));
        }
    }

    @HostListener('document:mousedown')
    onPointerDown() {
        this.pointerDown = true;
    }

    @HostListener('document:mouseup')
    onPointerUp() {
        this.pointerDown = false;
    }

    undo() {
        this.restored(this.history?.undo(this.dsl.reports));
    }

    redo() {
        this.restored(this.history?.redo(this.dsl.reports));
    }

    /** A step was restored into the reports: redraw, and re-query the charts whose content came back different */
    private restored(changed: ReportDSL[] | null | undefined) {
        if (!changed) return;
        this.unselect();
        this.cdr.detectChanges();
        changed.forEach(it => this.refreshItem(it));
    }

    /** An image address of the settings, ready to load: an uploaded one is a path under the attachment root */
    private imageUrl(value: any): string | null {
        const src = safeImageSrc(value);
        if (!src) return null;
        const attachment = '/erupt-attachment/';
        return src.startsWith(attachment) ? RestPath.eruptAttachment + src.substring(attachment.length - 1) : src;
    }

    /** The image shown in place of the title's mark */
    get logo(): string | null {
        return this.imageUrl(this.screen?.logo);
    }

    /** The background image of the settings as a CSS value */
    get backgroundImage(): string | null {
        const url = this.imageUrl(this.dsl?.settings?.backgroundImage);
        if (!url) return null;
        // inside url("..."): nothing of the address may end the string or the function
        return `url("${url.replace(/["\\\n\r]/g, encodeURIComponent)}")`;
    }

    /** A filter the viewer can set: a published screen shows its filter bar only when it has one */
    get hasVisibleFilter(): boolean {
        return !!this.dsl?.filters?.some(it => !it.hidden);
    }

    /** A data screen is always dark: its chrome is drawn for a dark stage */
    get dark(): boolean {
        return !!this.screen || this.dsl?.settings?.theme === DashboardTheme.DARK;
    }

    readonly widgets = WIDGETS;

    /** Puts a new widget on the canvas and selects it, so its properties are at hand */
    addWidget(def: WidgetDef) {
        const widget = newWidget(def, def.type === ReportType.LABEL ? {text: this.i18n.fanyi('cube.widget.LABEL')} : null);
        // each one a little further in, so widgets added in a row do not hide one another
        const shift = ((this.dsl.reports?.length || 0) % 10) * 24;
        widget.frame.x += shift;
        widget.frame.y += shift;
        this.dsl.reports.push(widget);
        this.selectLayer(widget);
    }

    isWidget(report: ReportDSL): boolean {
        return isWidget(report);
    }

    /** How a report is named in the layer panel: its title, a label's own text, or what kind of thing it is */
    layerName(report: ReportDSL): string {
        return report.title || (isWidget(report)
            ? (report.type === ReportType.LABEL && report.ui?.['text']) || this.i18n.fanyi('cube.widget.' + report.type)
            : report.type);
    }

    layerIcon(report: ReportDSL): string {
        return widgetDef(report.type)?.icon || 'pie-chart';
    }

    /** The panel drawn around a report on a screen: its own choice, else the screen's; a widget has none */
    panelStyle(report: ReportDSL): ScreenPanel {
        return isWidget(report) ? ScreenPanel.NONE : report.ui?.['screen']?.panel || this.screen.panel;
    }

    /** Frames of the selection were changed from outside the canvas (typed in, aligned) */
    onFrameInput() {
        for (const {frame} of this.selection) {
            frame.x ??= 0;
            frame.y ??= 0;
            frame.width ??= 20;
            frame.height ??= 20;
        }
        // the selection box is drawn from the elements: move those first
        this.cdr.detectChanges();
        this.editor?.refresh();
    }

    /** The chart component showing a report; a widget has none */
    private componentOf(report: ReportDSL): CubePuzzleReport | undefined {
        return this.reports.find(it => it.report === report);
    }

    refreshItem(report: ReportDSL) {
        this.componentOf(report)?.refresh();
    }

    download(report: ReportDSL) {
        this.componentOf(report)?.download();
    }

    /** Selects a report from the layer panel, or the widget just added */
    selectLayer(report: ReportDSL, event?: MouseEvent) {
        if (this.toggles(event)) {
            this.toggle(report, !!event?.altKey);
        } else {
            this.selection = event?.altKey ? [report] : this.withGroups([report]);
        }
        this.applySelection();
    }

    unselect() {
        this.selection = [];
        this.editor?.clear();
    }

    /**
     * Keys of the screen editor: arrows move the selection (with shift: ten pixels), delete removes it,
     * ctrl / cmd + Z undoes, with shift (or ctrl + Y) redoes, ctrl / cmd + A selects everything, C copies,
     * V pastes, D duplicates, G groups and with shift ungroups
     */
    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent) {
        const target = event.target as HTMLElement;
        if (!this.screen || !this.editModel || target.isContentEditable
            || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || document.querySelector('.ant-modal-wrap')) {
            return;
        }
        if (event.code === 'Space') {
            // held space arms the pan, and must not scroll the page or press a focused button
            this.panReady = true;
            event.preventDefault();
            return;
        }
        if (!this.editor) {
            return;
        }
        if (event.ctrlKey || event.metaKey) {
            const key = event.key.toLowerCase();
            if (key === 'z') {
                event.shiftKey ? this.redo() : this.undo();
            } else if (key === 'y') {
                this.redo();
            } else if (key === 'a') {
                this.selectAll();
            } else if (key === 'c') {
                this.copySelection();
            } else if (key === 'v') {
                this.paste();
            } else if (key === 'd') {
                this.paste(this.selection);
            } else if (key === 'g') {
                event.shiftKey ? this.ungroup() : this.group();
            } else {
                return;
            }
            event.preventDefault();
            return;
        }
        if (!this.selection.length) {
            return;
        }
        const step = event.shiftKey ? 10 : 1;
        const move = {ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step]}[event.key];
        if (move) {
            this.editor.nudge(move[0], move[1]);
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
            const gone = this.selection;
            this.unselect();
            this.dsl.reports = this.dsl.reports.filter(it => !gone.includes(it));
        } else {
            return;
        }
        event.preventDefault();
    }

    /** The layers as the panel lists them: front first. The order of dsl.reports is the layer order, last on top */
    get layers(): ReportDSL[] {
        return [...(this.dsl?.reports || [])].reverse();
    }

    /** The report whose layer row the pointer is on, outlined on the stage */
    hoverLayer: ReportDSL | null = null;

    dropLayer(event: CdkDragDrop<ReportDSL[]>) {
        const last = this.dsl.reports.length - 1;
        moveItemInArray(this.dsl.reports, last - event.previousIndex, last - event.currentIndex);
    }

    /** Moves a report to the front (or the back) of the layers */
    moveLayer(report: ReportDSL, front: boolean) {
        const reports = this.dsl.reports;
        moveItemInArray(reports, reports.indexOf(report), front ? reports.length - 1 : 0);
    }

    /** How the designer looks at the stage; the published view always shows it fitted */
    view: StageView = STAGE_VIEW_FIT;

    /** The transform that fits the stage into the viewport, which the view zooms and pans from */
    private fit: ScreenTransform | null = null;

    /** Space is held: the next drag moves the stage instead of a report */
    panReady = false;

    panning = false;

    /** The scale the stage is shown at, in percent */
    get zoomPercent(): number {
        return Math.round(this.scale * 100);
    }

    private fitStage() {
        if (!this.screen || !this.viewportEl) {
            this.stageTransform = null;
            this.fit = null;
            return;
        }
        // The designer shows the whole screen, at its ratio, as a sheet on a desk: a margin around it and
        // hung from the top, so the layer panel opening (a narrower viewport) does not push it about
        const pad = this.editModel ? 24 : 0;
        const t = screenTransform(this.editModel ? ScreenFit.CONTAIN : this.screen.fit, this.screen.width, this.screen.height,
            this.viewportEl.clientWidth - 2 * pad, this.viewportEl.clientHeight - 2 * pad);
        this.fit = {...t, left: t.left + pad, top: (this.editModel ? 0 : t.top) + pad};
        const view = this.editModel ? this.view : STAGE_VIEW_FIT;
        this.stageTransform = `translate(${this.fit.left + view.x}px, ${this.fit.top + view.y}px)`
            + ` scale(${t.x * view.zoom}, ${t.y * view.zoom})`;
        this.scale = t.x * view.zoom;
        this.editor?.zoom(this.scale);
    }

    /** Zooms the stage of the designer by a factor, around a point of the viewport (its center by default) */
    zoomStage(factor: number, px = this.viewportEl.clientWidth / 2, py = this.viewportEl.clientHeight / 2) {
        if (this.fit) {
            this.view = zoomAt(this.view, this.fit, factor, px, py);
            this.fitStage();
        }
    }

    /** Back to the whole screen, fitted */
    resetStage() {
        this.view = STAGE_VIEW_FIT;
        this.fitStage();
    }

    /** In the designer of a screen: ctrl / cmd + wheel (and a pinch) zooms at the pointer, a plain wheel pans */
    private onStageWheel(event: WheelEvent) {
        if (!this.screen || !this.editModel) return;
        event.preventDefault();
        this.zone.run(() => {
            if (event.ctrlKey || event.metaKey) {
                const box = this.viewportEl.getBoundingClientRect();
                this.zoomStage(Math.exp(-event.deltaY * 0.01), event.clientX - box.left, event.clientY - box.top);
            } else {
                this.view = {...this.view, x: this.view.x - event.deltaX, y: this.view.y - event.deltaY};
                this.fitStage();
            }
        });
    }

    /** A drag pans the stage when it starts with the middle button, with space held, or on the desk around the stage */
    private onStageMouseDown(event: MouseEvent) {
        if (!this.screen || !this.editModel) return;
        if (event.button !== 1 && !(event.button === 0 && (this.panReady || event.target === this.viewportEl))) return;
        event.preventDefault();
        event.stopPropagation();
        const start = {...this.view}, x = event.clientX, y = event.clientY;
        this.zone.run(() => this.panning = true);
        const move = (e: MouseEvent) => this.zone.run(() => {
            this.view = {...this.view, x: start.x + e.clientX - x, y: start.y + e.clientY - y};
            this.fitStage();
        });
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            this.zone.run(() => this.panning = false);
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    }

    @HostListener('document:keyup', ['$event'])
    onKeyup(event: KeyboardEvent) {
        if (event.code === 'Space') {
            this.panReady = false;
        }
    }

    query() {
        this.applyFilterDefaults();
        if (this.dsl?.filters) {
            for (const filter of this.dsl.filters) {
                if (filter.notNull && !filter.hidden) {
                    if (this.isEmptyValue(filter.value)) {
                        const label = filter.title || this.cubeMeta?.fieldTitleMap?.get(filter.field) || filter.field;
                        this.message.warning(`${label} ${this.i18n.fanyi('cube.filter.config.not_null')}`);
                    }
                }
            }
        }
        this.changedOptions();
        for (let report of this.reports) {
            report.refresh();
        }
        this.syncFiltersToUrl();
    }

    reset() {
        for (let filter of this.dsl.filters) {
            const rd = parseRelativeDefault(filter.defaultValue);
            if (rd && filter.operator === CubeOperator.BETWEEN) {
                filter.value = this.computeRelativeDateRange(rd);
            } else if (filter.defaultValue) {
                filter.value = filter.defaultValue;
            } else {
                if (filter.operator == CubeOperator.BETWEEN) {
                    filter.value = [null, null];
                } else {
                    filter.value = undefined;
                }
            }
        }
        for (let report of this.reports) {
            report.refresh();
        }
    }

    private computeRelativeDateRange(rd: {type: 'PAST' | 'FUTURE'; days: number}): [string, string] {
        const pad = (n: number) => String(n).padStart(2, '0');
        const fmt = (d: Date) =>
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        const now = new Date();
        if (rd.type === 'PAST') {
            const start = new Date(now);
            start.setDate(start.getDate() - rd.days);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setHours(23, 59, 59, 0);
            return [fmt(start), fmt(end)];
        } else {
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setDate(end.getDate() + rd.days);
            end.setHours(23, 59, 59, 0);
            return [fmt(start), fmt(end)];
        }
    }

    startEdit() {
        this.edit = true;
        this.options = {
            ...this.options,
            draggable: {...this.options.draggable, enabled: true},
            resizable: {...this.options.resizable, enabled: true}
        };
        this.tempDsl = cloneDeep(this.dsl);
        this.applyLayout();
        this.watchHistory();
    }

    publishDescription: string = "";

    publish() {
        this.publishDescription = "";
        this.modal.confirm({
            nzTitle: this.i18n.fanyi('cube.dashboard.publish_confirm'),
            nzContent: this.publishContent,
            nzOnOk: () => {
                this.publishing = true;
                this.cubeApiService.publish(this.dashboard.id, this.publishDescription).subscribe({
                    next: () => {
                        this.message.success(this.i18n.fanyi('cube.dashboard.publish_success'));
                        this.publishing = false;
                    },
                    error: () => {
                        this.publishing = false;
                    }
                });
            }
        });
    }

    historyList: DashboardPublishHistory[] = [];
    loadingHistory = false;

    showHistory() {
        this.loadingHistory = true;
        this.cubeApiService.publishHistory(this.dashboard.id).subscribe(res => {
            this.historyList = res.data;
            this.loadingHistory = false;
        });
        this.modal.create({
            nzTitle: this.i18n.fanyi('cube.dashboard.history_title'),
            nzContent: this.historyContent,
            nzWidth: 800,
            nzFooter: null
        });
    }

    rollback(history: DashboardPublishHistory) {
        this.modal.confirm({
            nzTitle: this.i18n.fanyi('cube.dashboard.rollback_confirm'),
            nzContent: this.i18n.fanyi('cube.dashboard.rollback_content_prefix') + (history.description || this.i18n.fanyi('cube.dashboard.history.no_desc')) + ` (${history.createTime})`,
            nzOnOk: () => {
                this.cubeApiService.rollback(this.dashboard.id, history.id).subscribe(() => {
                    this.message.success(this.i18n.fanyi('cube.dashboard.rollback_success'));
                    this.modal.closeAll();
                    this.ngOnInit(); // reload data
                    this.query();
                });
            }
        });
    }

    cancelEdit() {
        this.edit = false;
        this.options = {
            ...this.options,
            draggable: {...this.options.draggable, enabled: false},
            resizable: {...this.options.resizable, enabled: false}
        };
        this.dsl = this.tempDsl;
        this.tempDsl = null;
        this.applyLayout();
        this.watchHistory();
        this.initAutoRefresh();
    }

    saveEdit() {
        this.saving = true;
        this.cubeApiService.updateDsl(this.dashboard.id, this.dsl).subscribe(res => {
            this.tempDsl = null;
            this.options = {
                ...this.options,
                draggable: {...this.options.draggable, enabled: false},
                resizable: {...this.options.resizable, enabled: false}
            };
            this.edit = false;
            this.applyLayout();
            this.watchHistory();
        }, () => {
        }, () => {
            this.saving = false;
            for (let report of this.reports) {
                report.render()
            }
        })
    }

    changedOptions() {
        this.gridsterApi?.calculateLayout();
    }

    removeItem(index: number) {
        if (this.isSelected(this.dsl.reports[index])) {
            this.unselect();
        }
        this.dsl.reports.splice(index, 1);
        this.gridsterApi?.calculateLayout();
    }

    toggleFullscreen() {
        const el = this.el.nativeElement;
        if (!this.isFullscreen) {
            if (el.requestFullscreen) {
                el.requestFullscreen();
            } else if (el['webkitRequestFullscreen']) {
                el['webkitRequestFullscreen']();
            } else if (el['msRequestFullscreen']) {
                el['msRequestFullscreen']();
            }
            this.isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document['webkitExitFullscreen']) {
                document['webkitExitFullscreen']();
            } else if (document['msExitFullscreen']) {
                document['msExitFullscreen']();
            }
            this.isFullscreen = false;
        }
    }

    isItemFullscreen(panel: HTMLElement): boolean {
        return document.fullscreenElement === panel;
    }

    /** A report goes fullscreen with its panel */
    fullScreenItem(panel: HTMLElement) {
        if (this.isItemFullscreen(panel)) {
            document.exitFullscreen();
        } else {
            panel.requestFullscreen();
        }
    }

    addItem() {
        let ref = this.modal.create({
            nzDraggable: true,
            nzTitle: this.i18n.fanyi('cube.dashboard.add_report'),
            nzContent: CubePuzzleReportConfig,
            nzWidth: 1000,
            nzMaskClosable: false,
            nzStyle: {top: '50px', padding: 0},
            nzBodyStyle: {
                padding: "0"
            },
            nzOnOk: (instance) => {
                if (!this.dsl.reports) {
                    this.dsl.reports = [];
                }
                this.dsl.reports.push(instance.report);
                this.ensureFrames();
            }
        })
        ref.getContentComponent().cubeMeta = this.cubeMeta;
        ref.getContentComponent().dashboard = this.dashboard;
        ref.getContentComponent().dsl = this.dsl;
        ref.getContentComponent().report = {
            cols: 8,
            rows: 4,
            x: 0,
            y: 0,
            type: ReportType.LINE,
            title: this.i18n.fanyi('cube.report.config.title'),
            cube: {},
            ...(this.screen ? {frame: {x: 40, y: 40, width: 560, height: 360}} : {})
        };
    }

    copyItem(item: ReportDSL) {
        this.modal.confirm({
            nzTitle: this.i18n.fanyi('cube.dashboard.copy_confirm'),
            nzOnOk: () => {
                let dsl = deepCopy(item);
                dsl.x = 0;
                dsl.y = 0;
                if (dsl.frame) {
                    dsl.frame.x += 24;
                    dsl.frame.y += 24;
                }
                this.dsl.reports.push(dsl);
            }
        });

    }

    editItem(item: ReportDSL) {
        let ref = this.modal.create({
            nzDraggable: true,
            nzTitle: this.i18n.fanyi('cube.dashboard.edit_report'),
            nzContent: CubePuzzleReportConfig,
            nzWidth: 1000,
            nzMaskClosable: false,
            nzStyle: {top: '50px', padding: 0},
            nzBodyStyle: {
                padding: "0"
            },
            nzOnOk: (instance) => {
                // the dialog worked on a copy taken when it opened; the frame may have moved since
                Object.assign(item, instance.report, {frame: item.frame});
                this.refreshItem(item);
            }
        })
        ref.getContentComponent().cubeMeta = this.cubeMeta;
        ref.getContentComponent().dashboard = this.dashboard;
        ref.getContentComponent().dsl = this.dsl;
        ref.getContentComponent().report = cloneDeep(item);
    }

    addFilter() {
        let ref = this.modal.create({
            nzTitle: this.i18n.fanyi('cube.dashboard.add_filter'),
            nzContent: CubePuzzleFilterConfig,
            nzDraggable: true,
            nzMaskClosable: false,
            nzWidth: 600,
            nzOnOk: () => {
                let filter = ref.getContentComponent().filter;
                if (filter.field) {
                    if (!this.dsl.filters) {
                        this.dsl.filters = [];
                    }
                }
                this.dsl.filters.push(filter);
            }
        });
        ref.getContentComponent().dashboard = this.dashboard;
        ref.getContentComponent().cubeMeta = this.cubeMeta;
        ref.getContentComponent().dsl = this.dsl;
        ref.getContentComponent().filter = {
            title: null,
            field: this.cubeMeta.dimensions?.[0].code,
            operator: this.cubeMeta.dimensions?.[0].type == FieldType.DATE ? CubeOperator.BETWEEN : CubeOperator.EQ,
        }
    }

    removeFilter(index: number) {
        this.dsl.filters.splice(index, 1);
    }

    editFilter(index: number) {
        let ref = this.modal.create({
            nzTitle: this.i18n.fanyi('cube.dashboard.edit_filter'),
            nzContent: CubePuzzleFilterConfig,
            nzMaskClosable: false,
            nzDraggable: true,
            nzWidth: 600,
            nzOnOk: () => {
                let filter = ref.getContentComponent().filter;
                ref.getContentComponent().clean();
                if (filter.field) {
                    if (!this.dsl.filters) {
                        this.dsl.filters = [];
                    }
                }
                // sync defaultValue → value so the filter control immediately reflects the new default
                // (track $index prevents component instance recreation, so ngOnInit won't run again)
                const dv = filter.defaultValue;
                const rd = parseRelativeDefault(dv);
                const isEmpty = (v: any) => v === null || v === undefined
                    || (Array.isArray(v) && v.every((i: any) => i === null || i === undefined));
                if (rd && filter.operator === CubeOperator.BETWEEN) {
                    filter.value = this.computeRelativeDateRange(rd);
                } else if (!isEmpty(dv)) {
                    filter.value = dv;
                } else {
                    filter.value = filter.operator === CubeOperator.BETWEEN ? [null, null] : null;
                }
                this.dsl.filters[index] = filter;
            }
        });
        ref.getContentComponent().dashboard = this.dashboard;
        ref.getContentComponent().cubeMeta = this.cubeMeta;
        ref.getContentComponent().dsl = this.dsl;
        ref.getContentComponent().filter = deepCopy(this.dsl.filters[index])
    }

    dropFilter(event: CdkDragDrop<FilterDSL[]>) {
        moveItemInArray(this.dsl.filters, event.previousIndex, event.currentIndex);
    }

    dashboardSettings() {
        let ref = this.modal.create({
            nzTitle: this.i18n.fanyi('cube.dashboard.settings'),
            nzContent: CubePuzzleDashboardConfig,
            nzDraggable: true,
            nzMaskClosable: false,
            nzWidth: 520,
            nzOnOk: (instance) => {
                this.dsl.settings = instance.dsl.settings;
                this.applyLayout();
                // re-render reports to apply the new theme
                for (let report of this.reports) {
                    report.render();
                }
                this.initAutoRefresh();
            }
        });
        const screen = isScreen(this.dashboard);
        ref.getContentComponent().screen = screen;
        ref.getContentComponent().dsl = {
            settings: {
                // the chrome of a screen is drawn for a dark stage
                theme: screen ? DashboardTheme.DARK : DashboardTheme.LIGHT,
                autoRefreshInterval: 0,
                gap: 12,
                ...cloneDeep(this.dsl.settings),
                ...(screen ? {screen: {...SCREEN_DEFAULT, ...this.dsl.settings?.screen}} : {}),
            }
        };
    }

    manageSubModels() {
        let ref = this.modal.create({
            nzTitle: this.i18n.fanyi('cube.sub_model.manage'),
            nzContent: CubePuzzleSubModelConfig,
            nzDraggable: true,
            nzMaskClosable: false,
            nzWidth: 700,
            nzFooter: null
        });
        ref.getContentComponent().cubeMeta = this.cubeMeta;
        ref.getContentComponent().dsl = this.dsl;
    }

    initAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
            this.autoRefreshTimer = null;
        }
        if (this.dsl?.settings?.autoRefreshInterval > 0) {
            this.autoRefreshTimer = setInterval(() => {
                this.query();
            }, this.dsl.settings.autoRefreshInterval * 1000);
        }
    }

    readonly AI_ICON = AI_ICON;

    get isAiEnabled(): boolean {
        return EruptAppData.get().properties["erupt-ai"] && null != this.menuSrv.getItem("ai-chat");
    }

    private aiDrawerRef: NzDrawerRef | null = null;

    toggleAiPanel() {
        // On phones the inline side panel is too narrow — open the AI chat in a drawer instead.
        if (window.innerWidth <= 768) {
            this.openAiDrawer();
            return;
        }
        this.showAiPanel = !this.showAiPanel;
        localStorage.setItem(`cube-ai-panel-${this.code}`, JSON.stringify({open: this.showAiPanel, width: this.aiPanelWidth}));
        setTimeout(() => this.changedOptions(), 0);
    }

    private openAiDrawer() {
        if (this.aiDrawerRef) {
            return;
        }
        this.aiDrawerRef = this.drawerService.create<AiChatComponent>({
            nzContent: AiChatComponent,
            nzContentParams: {collapseSidebar: true, embedded: true, context: this.aiContext, contextName: this.dashboard?.name},
            nzTitle: this.i18n.fanyi('ai.chat.title'),
            nzWidth: '100%',
            nzBodyStyle: {padding: '0', height: '100%'}
        });
        this.aiDrawerRef.afterClose.subscribe(() => this.aiDrawerRef = null);
    }

    onAiResizeDragStart(e: MouseEvent) {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = this.aiPanelWidth;
        this.aiResizing = true;
        const onMove = (ev: MouseEvent) => {
            this.aiPanelWidth = Math.max(280, Math.min(800, startWidth + startX - ev.clientX));
        };
        const onUp = () => {
            this.aiResizing = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            localStorage.setItem(`cube-ai-panel-${this.code}`, JSON.stringify({open: this.showAiPanel, width: this.aiPanelWidth}));
            this.changedOptions();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        this._aiResizeCleanup = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }

    private buildAiContext() {
        const lines: string[] = [
            `The user is viewing a data analytics dashboard named "${this.dashboard.name}".`
        ];
        if (this.dashboard.description) {
            lines.push(`Dashboard description: ${this.dashboard.description}`);
        }
        lines.push(`Main data model: cube "${this.dashboard.cuber}", explore "${this.dashboard.explore}".`);
        const subModels = this.dsl?.subModels;
        if (subModels?.length) {
            lines.push(`Associated models:`);
            subModels.forEach(sm => lines.push(`  - ${sm.alias}: cube "${sm.cube}", explore "${sm.explore}"`));
        }
        this.aiContext = lines.join('\n');
    }

    ngOnDestroy() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
        }
        clearInterval(this.clockTimer);
        clearInterval(this.historyTimer);
        this.viewportObserver?.disconnect();
        this.editor?.destroy();
        if (this._aiResizeCleanup) {
            this._aiResizeCleanup();
        }
    }

    /**
     * Chart linkage filter: when a chart element corresponding to the X axis is clicked,
     * write the dimension value into the filter and refresh
     */
    onFilterLink(payload: { field: string; value: any }) {
        if (!this.dsl || !payload?.field) {
            return;
        }
        if (!this.dsl.filters) {
            this.dsl.filters = [];
        }
        let filter = this.dsl.filters.find(f => f.field === payload.field
            && (f.operator == CubeOperator.EQ || f.operator == CubeOperator.IN));
        if (filter) {
            filter.value = Array.isArray(filter.value) ? [payload.value] : payload.value;
            filter.operator = filter.operator ?? CubeOperator.IN;
        } else {
            this.dsl.filters.push({
                title: this.cubeMeta.fieldTitleMap?.get(payload.field),
                field: payload.field,
                operator: CubeOperator.IN,
                hidden: true,
                value: [payload.value]
            });
        }
        this.query();
    }

    copyLink() {
        const url = window.location.href;
        const hashIndex = url.indexOf('#');
        if (hashIndex !== -1) {
            const baseUrl = url.substring(0, hashIndex + 1);
            let newUrl = baseUrl + '/fill/cube/' + this.dashboard?.code;
            const filterValues = this.collectFilterValues();
            if (Object.keys(filterValues).length > 0) {
                newUrl += '?filters=' + encodeURIComponent(JSON.stringify(filterValues));
            }
            this.clipboard.copy(newUrl, this.i18n.fanyi('cube.dashboard.copy_success'));
        }
    }

    private collectFilterValues(): Record<string, any> {
        const result: Record<string, any> = {};
        for (const f of (this.dsl?.filters || [])) {
            if (f.hidden) continue;
            const v = f.value;
            if (v === null || v === undefined) continue;
            const isEmpty = Array.isArray(v) && v.every((i: any) => i === null || i === undefined);
            if (!isEmpty) result[f.field] = v;
        }
        return result;
    }

    private syncFiltersToUrl() {
        const filterValues = this.collectFilterValues();
        const hasValues = Object.keys(filterValues).length > 0;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: hasValues ? {filters: JSON.stringify(filterValues)} : {},
            replaceUrl: true,
        });
    }

    getFilterWidth(filter: FilterDSL): string {
        let type = FieldType.STRING;
        if (this.cubeMeta) {
            const field = this.cubeMeta.dimensions?.find(d => d.code === filter.field)
                || this.cubeMeta.measures?.find(m => m.code === filter.field)
                || this.cubeMeta.parameters?.find(p => p.code === filter.field);
            if (field) type = field.type;
        }
        if (type === FieldType.DATE) {
            if (filter.operator === CubeOperator.BETWEEN) return '360px';
            if (filter.operator === CubeOperator.FEW_DAYS || filter.operator === CubeOperator.FUTURE_DAYS) return '140px';
            return '200px';
        }
        if (type === FieldType.NUMBER) {
            return filter.operator === CubeOperator.BETWEEN ? '240px' : '140px';
        }
        if (filter.operator === CubeOperator.NULL || filter.operator === CubeOperator.NOT_NULL) return '120px';
        return '180px';
    }

    protected readonly ReportType = ReportType;
    protected readonly DashboardTheme = DashboardTheme;
    protected readonly ScreenFit = ScreenFit;
}
