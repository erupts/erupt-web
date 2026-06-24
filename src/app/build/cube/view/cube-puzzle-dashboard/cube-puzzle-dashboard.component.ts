import {
    Component,
    ElementRef,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    QueryList,
    TemplateRef,
    ViewChild,
    ViewChildren
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {GridsterConfig} from "angular-gridster2";
import {CubeApiService} from "../../service/cube-api.service";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {I18NService} from '@core';
import {MenuService} from "@delon/theme";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {CubePuzzleReportConfig} from "../cube-puzzle-report-config/cube-puzzle-report-config";
import {
    Dashboard,
    DashboardDSL,
    DashboardPublishHistory,
    DashboardTheme,
    FilterDSL,
    parseRelativeDefault,
    ReportDSL,
    ReportType
} from "../../model/dashboard.model";
import {BaseField, CubeMeta, FieldType} from "../../model/cube.model";
import {cloneDeep} from "lodash";
import {CubePuzzleReport} from "../cube-puzzle-report/cube-puzzle-report";
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {CubeOperator} from "../../model/cube-query.model";
import {CubePuzzleFilterConfig} from "../cube-puzzle-filter-config/cube-puzzle-filter-config";
import {deepCopy} from "@delon/util";
import {CubePuzzleDashboardConfig} from "../cube-puzzle-dashboard-config/cube-puzzle-dashboard-config";
import {CubePuzzleSubModelConfig} from "../cube-puzzle-sub-model-config/cube-puzzle-sub-model-config";

@Component({
    standalone: false,
    selector: 'cube-puzzle-dashboard',
    templateUrl: './cube-puzzle-dashboard.component.html',
    styleUrls: ['./cube-puzzle-dashboard.component.less']
})
export class CubePuzzleDashboardComponent implements OnInit, OnDestroy {

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

    private gridsterApi: any;

    constructor(private router: Router, private route: ActivatedRoute,
                private cubeApiService: CubeApiService,
                private el: ElementRef,
                private message: NzMessageService,
                @Inject(NzModalService) private modal: NzModalService,
                private i18n: I18NService,
                private menuSrv: MenuService
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
                if (s.open) this.showAiPanel = true;
                if (s.width) this.aiPanelWidth = s.width;
            } catch {}
        }
        this.cubeApiService.dashboardDetail(this.code).subscribe(res => {
            this.dashboard = res.data;
            if (this.editModel) {
                this.dsl = res.data.draftDsl;
            } else {
                this.dsl = res.data.publishDsl || {};
            }
            this.options = {...this.options, margin: this.dsl?.settings?.gap ?? 12};
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
            this.cubeApiService.cubeMetadata(this.dashboard.cuber, this.dashboard.explore).subscribe(res => {
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

    query() {
        if (this.dsl?.filters) {
            for (const filter of this.dsl.filters) {
                // if the current value is empty but a default value exists, apply the default first
                const isEmpty = (v: any) => v === null || v === undefined || v === ''
                    || (Array.isArray(v) && v.every(i => i === null || i === undefined));
                if (isEmpty(filter.value)) {
                    const rd = parseRelativeDefault(filter.defaultValue);
                    if (rd && filter.operator === CubeOperator.BETWEEN) {
                        filter.value = this.computeRelativeDateRange(rd);
                    } else if (!isEmpty(filter.defaultValue)) {
                        filter.value = filter.defaultValue;
                    }
                }
                if (filter.notNull && !filter.hidden) {
                    const v = filter.value;
                    if (isEmpty(v)) {
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
        this.dsl.reports.splice(index, 1);
        this.gridsterApi?.calculateLayout();
    }

    refreshItem(index: number) {
        const reportComponent = this.reports.toArray()[index];
        if (reportComponent) {
            reportComponent.refresh();
        }
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

    isItemFullscreen(index: number): boolean {
        const reportComponent = this.reports?.toArray()[index];
        if (reportComponent) {
            const el = reportComponent.el.nativeElement.parentElement.parentElement;
            return document.fullscreenElement === el;
        }
        return false;
    }

    fullScreenItem(index: number) {
        const reportComponent = this.reports.toArray()[index];
        if (reportComponent) {
            const el = reportComponent.el.nativeElement.parentElement.parentElement;
            if (document.fullscreenElement === el) {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document['webkitExitFullscreen']) {
                    document['webkitExitFullscreen']();
                } else if (document['msExitFullscreen']) {
                    document['msExitFullscreen']();
                }
            } else {
                if (el.requestFullscreen) {
                    el.requestFullscreen();
                } else if (el['webkitRequestFullscreen']) {
                    el['webkitRequestFullscreen']();
                } else if (el['msRequestFullscreen']) {
                    el['msRequestFullscreen']();
                }
            }
        }
    }

    download(index: number) {
        const reportComponent = this.reports.toArray()[index];
        if (reportComponent) {
            reportComponent.download();
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
            cube: {}
        };
    }

    copyItem(index: number, item: ReportDSL) {
        this.modal.confirm({
            nzTitle: this.i18n.fanyi('cube.dashboard.copy_confirm'),
            nzOnOk: () => {
                let dsl = deepCopy(item);
                dsl.x = 0;
                dsl.y = 0;
                this.dsl.reports.push(dsl);
            }
        });

    }

    editItem(index: number, item: ReportDSL) {
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
                Object.assign(item, instance.report);
                if (index !== -1) {
                    const reportComponent = this.reports.toArray()[index];
                    if (reportComponent) {
                        reportComponent.refresh();
                    }
                }
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
            nzWidth: 400,
            nzOnOk: (instance) => {
                if (!this.dsl.settings) {
                    this.dsl.settings = {};
                }
                this.dsl.settings.backgroundColor = instance.dsl.settings.backgroundColor;
                this.dsl.settings.backgroundImage = instance.dsl.settings.backgroundImage;
                this.dsl.settings.theme = instance.dsl.settings.theme;
                this.dsl.settings.autoRefreshInterval = instance.dsl.settings.autoRefreshInterval;
                this.dsl.settings.gap = instance.dsl.settings.gap;
                this.options = {...this.options, margin: this.dsl.settings.gap ?? 12};
                // re-render reports to apply the new theme
                for (let report of this.reports) {
                    report.render();
                }
                this.initAutoRefresh();
            }
        });
        ref.getContentComponent().dsl = {
            settings: {
                backgroundColor: this.dsl.settings?.backgroundColor,
                backgroundImage: this.dsl.settings?.backgroundImage,
                theme: this.dsl.settings?.theme || DashboardTheme.LIGHT,
                autoRefreshInterval: this.dsl.settings?.autoRefreshInterval || 0,
                gap: this.dsl.settings?.gap ?? 12,
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

    get isAiEnabled(): boolean {
        return EruptAppData.get().properties["erupt-ai"] && null != this.menuSrv.getItem("ai-chat");
    }

    toggleAiPanel() {
        this.showAiPanel = !this.showAiPanel;
        localStorage.setItem(`cube-ai-panel-${this.code}`, JSON.stringify({open: this.showAiPanel, width: this.aiPanelWidth}));
        setTimeout(() => this.changedOptions(), 0);
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
            navigator.clipboard.writeText(newUrl).then(() => {
                this.message.success(this.i18n.fanyi('cube.dashboard.copy_success'));
            });
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
}
