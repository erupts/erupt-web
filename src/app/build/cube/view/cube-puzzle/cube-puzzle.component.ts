import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {GridsterConfig} from "angular-gridster2";
import {CubeApiService} from "../../service/cube-api.service";
import {NzModalService} from "ng-zorro-antd/modal";
import {CubePuzzleReportConfig} from "../cube-puzzle-report-config/cube-puzzle-report-config";
import {TransferItem} from "ng-zorro-antd/transfer";
import {Dashboard, DashboardDSL, ReportDSL, ReportType} from "../../cube/dashboard.model";
import {CubeMeta} from "../../cube/cube.model";
import {cloneDeep} from "lodash";

@Component({
    standalone: false,
    selector: 'app-cube-management',
    templateUrl: './cube-puzzle.component.html',
    styleUrls: ['./cube-puzzle.component.less']
})
export class CubePuzzleComponent implements OnInit {

    options: GridsterConfig;

    edit = false;

    isFillRoute = false;

    code!: string;

    saving: boolean = false;

    dashboard: Dashboard;

    cubeMeta: CubeMeta;

    filters: { [key: string]: any } = {};

    activeFilterCodes: Set<string> = new Set();

    tempDsl: DashboardDSL;

    dsl: DashboardDSL;

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
        })
    }

    changedOptions() {
        this.options.api.optionsChanged();
    }

    removeItem(index: number) {
        this.dsl.reports.splice(index, 1);
        this.options.api.optionsChanged();
    }

    addItem() {
        let ref = this.modal.create({
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
                this.dsl.reports.push(instance.reportDSL);
            }
        })
        ref.getContentComponent().cubeMeta = this.cubeMeta;
        ref.getContentComponent().reportDSL = {
            cols: 8,
            rows: 4,
            x: 0,
            y: 0,
            type: ReportType.BAR,
            title: '图表标题',
            cube: {}
        };
    }

    editItem(item: ReportDSL) {

    }

    private checkFillRoute() {
        const url = this.router.url;
        // 检查根路由是否是 fill（路径以 /fill 开头）
        // 例如: /fill/cube/puzzle/123
        this.isFillRoute = url.startsWith('/fill/');
    }

    @ViewChild('transferTpl') transferTpl: any;

    transferList: TransferItem[] = [];

    addFilter() {
        this.transferList = [];
        this.cubeMeta.dimensions.forEach(dim => {
            if (!dim.hidden) {
                this.transferList.push({
                    key: dim.code,
                    title: dim.title,
                    direction: this.activeFilterCodes.has(dim.code) ? 'right' : 'left'
                });
            }
        });
        this.cubeMeta.measures.forEach(mea => {
            if (!mea.hidden) {
                this.transferList.push({
                    key: mea.code,
                    title: mea.title,
                    direction: this.activeFilterCodes.has(mea.code) ? 'right' : 'left'
                });
            }
        });
        this.modal.create({
            nzTitle: 'Add Filter',
            nzWidth: 600,
            nzContent: this.transferTpl,
            nzOnOk: () => {
                const selectedKeys = this.transferList
                    .filter(item => item.direction === 'right')
                    .map(item => item['key']);
                this.activeFilterCodes = new Set(selectedKeys);
            }
        });
    }

    transferChange(params: any) {
        // console.log(params);
    }

}
