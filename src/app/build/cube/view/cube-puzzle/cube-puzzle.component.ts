import {Component, Inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {GridsterConfig, GridsterItem} from "angular-gridster2";
import {CubeApiService} from "../../service/cube-api.service";
import {NzModalService} from "ng-zorro-antd/modal";
import {CubeMeta, Dashboard} from "../../cube/cube.model";
import {CubePuzzleConfig} from "../cube-puzzle-config/cube-puzzle-config";

@Component({
    standalone: false,
    selector: 'app-cube-management',
    templateUrl: './cube-puzzle.component.html',
    styleUrls: ['./cube-puzzle.component.less']
})
export class CubePuzzleComponent implements OnInit {

    options: GridsterConfig = {
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
            enabled: true,
            ignoreContent: true,  // 忽略内容区域，只有拖拽手柄可以拖拽
            ignoreContentClass: 'gridster-item-content',  // 排除内容区域
            dragHandleClass: 'drag-handler',  // 只有带此类的元素才能拖拽
            dropOverItems: true,  // 允许拖拽到其他项目上
            dropOverItemsCallback: null,
        },
        resizable: {
            enabled: true
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

    gridsterItems: GridsterItem[];

    isFillRoute = false;

    code!: string;

    dashboard: Dashboard;

    cubeMeta: CubeMeta;

    constructor(private router: Router, private route: ActivatedRoute,
                private cubeApiService: CubeApiService,
                @Inject(NzModalService) private modal: NzModalService
    ) {

    }

    ngOnInit() {
        this.checkFillRoute();
        this.code = this.route.snapshot.paramMap.get('code')!;
        this.cubeApiService.dashboardDetail(this.code).subscribe(res => {
            this.dashboard = res.data;
            this.cubeApiService.cubeMetadata(this.dashboard.cube, this.dashboard.explore).subscribe(res => {
                this.cubeMeta = res.data;
            })
        })
        this.gridsterItems = [
            {
                cols: 6,
                rows: 4,
                x: 0,
                y: 0,
            },
            {
                cols: 6,
                rows: 4,
                x: 6,
                y: 0,
            },
            {
                cols: 6,
                rows: 4,
                x: 12,
                y: 0,
            },
            {
                cols: 6,
                rows: 4,
                x: 18,
                y: 0,
            },
            {
                cols: 16,
                rows: 6,
                x: 0,
                y: 4,
            }
        ];
    }

    changedOptions() {
        this.options.api.optionsChanged();
    }

    removeItem(item: GridsterItem) {
        this.gridsterItems.splice(this.gridsterItems.indexOf(item), 1);
    }

    addItem() {
        let ref = this.modal.create({
            nzTitle: 'Add Report',
            nzContent: CubePuzzleConfig,
            nzWidth: 1000,
            nzMaskClosable: false,
            nzStyle: {top: '50px', padding: 0},
            nzBodyStyle: {
                padding: "0"
            },
            nzData: {
                cubeMeta: this.cubeMeta
            },
            nzOnOk: (instance) => {
                this.gridsterItems.push({
                    cols: 6,
                    rows: 4,
                    x: 0,
                    y: 0,
                    chartType: instance.chartType,
                    config: instance.config
                });
            }
        })
    }

    editItem(item: GridsterItem) {
        let ref = this.modal.create({
            nzTitle: 'Edit Report',
            nzContent: CubePuzzleConfig,
            nzWidth: 1000,
            nzMaskClosable: false,
            nzStyle: {top: '50px', padding: 0},
            nzBodyStyle: {
                padding: "0"
            },
            nzData: {
                cubeMeta: this.cubeMeta,
                chartType: item['chartType'] || 'column',
                config: item['config'] || {}
            },
            nzOnOk: (instance) => {

            }
        });
    }

    private checkFillRoute() {
        const url = this.router.url;
        // 检查根路由是否是 fill（路径以 /fill 开头）
        // 例如: /fill/cube/puzzle/123
        this.isFillRoute = url.startsWith('/fill/');
    }

}
