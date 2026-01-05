import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {GridsterConfig, GridsterItem} from "angular-gridster2";

@Component({
    standalone: false,
    selector: 'app-cube-management',
    templateUrl: './cube-management.component.html',
    styleUrls: ['./cube-management.component.less']
})
export class CubeManagementComponent implements OnInit {

    options: GridsterConfig;

    dashboard: GridsterItem[];

    isFillRoute = false;

    constructor(
        private router: Router
    ) {
    }

    ngOnInit() {
        // 检查根路由是否包含 fill
        this.checkFillRoute();

        this.options = {
            gridType: 'scrollVertical',
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
                enabled: true,
                handles: {
                    s: true,  // 南（下）
                    e: true,  // 东（右）
                    n: true,  // 北（上）
                    w: true,  // 西（左）
                    se: true, // 东南（右下）
                    ne: true, // 东北（右上）
                    sw: true, // 西南（左下）
                    nw: true  // 西北（左上）
                }
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
            scrollToNewItems: false,
            itemChangeCallback: (item, itemComponent) => {

            },
            itemResizeCallback: (item, itemComponent) => {

            },
        };

        this.dashboard = [
            {
                cols: 2,
                rows: 1,
                x: 0,
                y: 0,
                src: "https://th.bing.com/th/id/OIP.b8a6FSvVMIkoQI0waLqv-AHaJQ?w=219&h=274&c=7&o=7&dpr=2&pid=1.7&rm=3"
            },
            {
                cols: 2,
                rows: 1,
                x: 1,
                y: 0,
                src: "https://th.bing.com/th/id/OIP.Uyj3H0AZpI8EJt5hbFzePAHaKO?w=219&h=302&c=7&o=7&dpr=2&pid=1.7&rm=3"
            },
            {
                cols: 10,
                rows: 2,
                x: 0,
                y: 1,
                src: "https://th.bing.com/th/id/OIP.lsYMVeUiBR295jbHHa3CCQHaIt?w=219&h=257&c=7&o=5&dpr=2&pid=1.20"
            }
        ];
    }

    changedOptions() {
        this.options.api.optionsChanged();
    }

    removeItem(item: GridsterItem) {
        this.dashboard.splice(this.dashboard.indexOf(item), 1);
    }

    addItem() {
        // this.dashboard.push({});
    }

    private checkFillRoute() {
        // 获取当前路由的完整路径
        const url = this.router.url;
        // 检查根路由是否是 fill（路径以 /fill 开头）
        // 例如: /fill/cube/puzzle/management
        this.isFillRoute = url.startsWith('/fill/');
    }

}
