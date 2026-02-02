import {Component, ElementRef, Inject, OnInit, QueryList, ViewChildren} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {GridsterConfig} from "angular-gridster2";
import {CubeApiService} from "../../service/cube-api.service";
import {NzModalService} from "ng-zorro-antd/modal";
import {CubePuzzleReportConfig} from "../cube-puzzle-report-config/cube-puzzle-report-config";
import {
    CubeKey,
    Dashboard,
    DashboardDSL,
    FilterControl,
    FilterDSL,
    ReportDSL,
    ReportType
} from "../../model/dashboard.model";
import {CubeMeta} from "../../model/cube.model";
import {cloneDeep} from "lodash";
import {
    Area,
    Bar,
    Chord,
    Column,
    Funnel,
    Gauge,
    Line,
    Pie,
    Progress,
    Radar,
    RadialBar,
    RingProgress,
    Rose,
    Sankey,
    Scatter,
    TinyArea,
    TinyColumn,
    TinyLine,
    Waterfall,
    WordCloud
} from '@antv/g2plot';
import {CubePuzzleReport} from "../cube-puzzle-report/cube-puzzle-report";
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {CubeOperator} from "../../model/cube-query.model";
import {CubePuzzleFilterConfig} from "../cube-puzzle-filter-config/cube-puzzle-filter-config";
import {deepCopy} from "@delon/util";
import {R} from "@shared/model/api.model";

@Component({
    standalone: false,
    selector: 'cube-puzzle-dashboard',
    templateUrl: './cube-puzzle-dashboard.component.html',
    styleUrls: ['./cube-puzzle-dashboard.component.less']
})
export class CubePuzzleDashboardComponent implements OnInit {

    options: GridsterConfig;

    edit = false;

    isFillRoute = false;

    code!: string;

    saving: boolean = false;

    dashboard: Dashboard;

    cubeMeta: CubeMeta;

    tempDsl: DashboardDSL;

    dsl: DashboardDSL;

    @ViewChildren(CubePuzzleReport) reports: QueryList<CubePuzzleReport>;

    charts: any[] = [];

    constructor(private router: Router, private route: ActivatedRoute,
                private cubeApiService: CubeApiService,
                @Inject(NzModalService) private modal: NzModalService
    ) {

    }

    ngOnInit() {
        this.options = {
            gridType: 'verticalFixed',
            compactType: 'none',
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
            fixedRowHeight: 55,
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
                ignoreContent: true,  // 忽略内容区域，只有拖拽手柄可以拖拽
                ignoreContentClass: 'gridster-item-content',  // 排除内容区域
                dragHandleClass: 'drag-handler',  // 只有带此类的元素才能拖拽
                dropOverItems: true,  // 允许拖拽到其他项目上
                dropOverItemsCallback: null,
            },
            resizable: {
                enabled: this.edit
            },
            swap: true,  // 启用交换位置功能
            swapWhileDragging: false,  // 是否在拖拽过程中实时交换（false 表示释放时交换）
            pushItems: true,
            disablePushOnDrag: false,
            disablePushOnResize: false,
            pushResizeItems: false,
            displayGrid: 'onDrag&Resize',
            disableWindowResize: false,
            disableWarnings: false,
            scrollToNewItems: false
        };
        this.checkFillRoute();
        this.code = this.route.snapshot.paramMap.get('code')!;
        this.cubeApiService.dashboardDetail(this.code).subscribe(res => {
            this.dashboard = res.data;
            this.dsl = res.data.draftDsl;
            this.cubeApiService.cubeMetadata(this.dashboard.cuber, this.dashboard.explore).subscribe(res => {
                this.cubeMeta = res.data;
            })
        })
    }

    query() {
        this.changedOptions();
        for (let report of this.reports) {
            report.refresh();
        }
    }

    reset() {
        for (let filter of this.dsl.filters) {
            if (filter.defaultValue) {
                filter.value = filter.defaultValue;
            } else {
                if (filter.operator == CubeOperator.BETWEEN) {
                    filter.value = [null, null];
                } else {
                    filter.value = null;
                }
            }
        }
        for (let report of this.reports) {
            report.refresh();
        }
    }

    startEdit() {
        this.edit = true;
        this.options.draggable!.enabled = true;
        this.options.resizable!.enabled = true;
        this.tempDsl = cloneDeep(this.dsl);
        this.changedOptions();
    }

    cancelEdit() {
        this.edit = false;
        this.options.draggable!.enabled = false;
        this.options.resizable!.enabled = false;
        this.dsl = this.tempDsl;
        this.tempDsl = null;
        this.changedOptions();
    }

    saveEdit() {
        this.saving = true;
        this.cubeApiService.updateDsl(this.dashboard.id, this.dsl).subscribe(res => {
            this.tempDsl = null;
            this.options.draggable!.enabled = false;
            this.options.resizable!.enabled = false;
            this.changedOptions();
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
        this.options.api?.optionsChanged();
    }

    removeItem(index: number) {
        this.dsl.reports.splice(index, 1);
        this.options.api.optionsChanged();
    }

    refreshItem(index: number) {
        const reportComponent = this.reports.toArray()[index];
        if (reportComponent) {
            reportComponent.refresh();
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
            nzTitle: 'Add Report',
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
        ref.getContentComponent().report = {
            cols: 8,
            rows: 4,
            x: 0,
            y: 0,
            type: ReportType.LINE,
            title: '标题',
            cube: {}
        };
    }

    copyItem(index: number, item: ReportDSL) {
        this.modal.confirm({
            nzTitle: '确定要复制吗',
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
            nzTitle: 'Edit Report',
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
        ref.getContentComponent().report = cloneDeep(item);
    }

    private checkFillRoute() {
        const url = this.router.url;
        // 检查根路由是否是 fill（路径以 /fill 开头）
        // 例如: /fill/cube/puzzle/123
        this.isFillRoute = url.startsWith('/fill/');
    }

    addFilter() {
        let ref = this.modal.create({
            nzTitle: 'Add Filter',
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
        ref.getContentComponent().filter = {
            field: this.cubeMeta.dimensions?.[0].code,
            operator: CubeOperator.IN
        }
    }

    removeFilter(index: number) {
        this.dsl.filters.splice(index, 1);
    }

    editFilter(index: number) {
        let ref = this.modal.create({
            nzTitle: 'Add Filter',
            nzContent: CubePuzzleFilterConfig,
            nzMaskClosable: false,
            nzDraggable: true,
            nzWidth: 600,
            nzOnOk: () => {
                // ref.getContentComponent()
                let filter = ref.getContentComponent().filter;
                ref.getContentComponent().clean();
                if (filter.field) {
                    if (!this.dsl.filters) {
                        this.dsl.filters = [];
                    }
                }
                this.dsl.filters[index] = filter;
            }
        });
        ref.getContentComponent().dashboard = this.dashboard;
        ref.getContentComponent().cubeMeta = this.cubeMeta;
        ref.getContentComponent().filter = deepCopy(this.dsl.filters[index])
    }

    getFieldTitle(code: string) {
        if (!this.cubeMeta) return code;
        const dim = this.cubeMeta.dimensions.find(d => d.code === code);
        if (dim) return dim.title;
        const mea = this.cubeMeta.measures.find(m => m.code === code);
        if (mea) return mea.title;
        return code;
    }

    dropFilter(event: CdkDragDrop<FilterDSL[]>) {
        moveItemInArray(this.dsl.filters, event.previousIndex, event.currentIndex);
    }

    /**
     * 图表联动筛选：点击图表 X 轴对应元素时，将对应维度值写入筛选并刷新
     */
    onFilterLink(payload: { field: string; value: any }) {
        if (!this.dsl || !payload?.field) {
            return;
        }
        if (!this.dsl.filters) {
            this.dsl.filters = [];
        }
        let filter = this.dsl.filters.find(f => f.field === payload.field);
        if (filter) {
            filter.value = Array.isArray(filter.value) ? [payload.value] : payload.value;
            filter.operator = filter.operator ?? CubeOperator.IN;
        } else {
            this.dsl.filters.push({
                field: payload.field,
                operator: CubeOperator.IN,
                hidden: true,
                value: [payload.value]
            });
        }
        this.query();
    }

    protected readonly ReportType = ReportType;
}
