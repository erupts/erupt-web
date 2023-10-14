import {Component, Inject, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {Bi, columnType, DimType, pageType} from "../model/bi.model";
import {BiDataService} from "../service/data.service";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {ChartComponent} from "../chart/chart.component";
import {HandlerService} from "../service/handler.service";
import {SettingsService} from "@delon/theme";
import {isNotNull, isNull} from "@shared/util/erupt.util";
import {DrillComponent} from "../drill/drill.component";
import {STColumn, STComponent} from "@delon/abc/st";
import {STPage} from "@delon/abc/st/st.interfaces";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {AppViewService} from "@shared/service/app-view.service";

@Component({
    selector: 'bi-skeleton',
    templateUrl: './skeleton.component.html',
    styleUrls: ["./skeleton.component.less"],
    styles: []
})
export class SkeletonComponent implements OnInit, OnDestroy {

    bi: Bi;

    name: string;

    haveNotNull: boolean = false;

    querying: boolean = false;

    clientWidth = document.body.clientWidth;

    hideCondition: boolean = false;

    @ViewChild("st") st: STComponent;

    @ViewChildren('biChart') biCharts: QueryList<ChartComponent>;

    pageType = pageType;

    sort: {
        column?: string,
        direction?: 'ascend' | 'descend' | null
    } = {
        direction: null
    };

    biTable: {

        data?: any,

        index: number;

        size: number;

        total: number;

        pageType?: pageType;

        page: STPage;

        pageSizeOptions?: number[];

    } = {
        index: 1,

        size: 10,

        total: 0,

        page: {
            show: false
        }
    };


    columns: STColumn[] = [];

    timer: NodeJS.Timer;

    downloading: boolean = false;

    private router$: Subscription;

    constructor(private dataService: BiDataService,
                public route: ActivatedRoute,
                private handlerService: HandlerService,
                public settingSrv: SettingsService,
                private appViewService: AppViewService,
                @Inject(NzMessageService) private msg: NzMessageService,
                @Inject(NzModalService) private modal: NzModalService
    ) {
    }

    ngOnInit() {
        this.router$ = this.route.params.subscribe(params => {
            this.timer && clearInterval(this.timer);
            this.name = params['name'];
            this.biTable.data = null;
            this.dataService.getBiBuild(this.name).subscribe(res => {
                this.bi = res;
                this.appViewService.setRouterViewDesc(this.bi.remark)
                if (this.bi.pageType == pageType.front) {
                    this.biTable.page = {
                        show: true,
                        front: true,
                        placement: "center",
                        showSize: true,
                        showQuickJumper: true,
                    };
                }
                this.biTable.size = this.bi.pageSize;
                this.biTable.page.pageSizes = this.bi.pageSizeOptions;
                for (let dimension of res.dimensions) {
                    if (dimension.type === DimType.NUMBER_RANGE) {
                        dimension.$value = [];
                    }
                    if (isNotNull(dimension.defaultValue)) {
                        dimension.$value = dimension.defaultValue;
                    }
                    if (dimension.notNull && isNull(dimension.$value)) {
                        this.haveNotNull = true;
                        return;
                    }
                }
                this.query({
                    pageIndex: 1,
                    pageSize: this.biTable.size
                });
                if (this.bi.refreshTime) {
                    this.timer = setInterval(() => {
                        this.query({
                            pageIndex: this.biTable.index,
                            pageSize: this.biTable.size
                        }, true, false);
                    }, this.bi.refreshTime * 1000);
                }
            });
        });
    }

    query(page: {
        pageIndex: number,
        pageSize: number
    }, updateChart?: boolean, chartLoading: boolean = true) {
        let param = this.handlerService.buildDimParam(this.bi);
        if (!param) {
            return;
        }
        if (updateChart) {
            this.biCharts.forEach(chart => chart.update(chartLoading));
        }
        if (this.bi.table) {
            this.querying = true;
            this.biTable.index = page.pageIndex;
            this.dataService.getBiData(this.bi.code, page.pageIndex, page.pageSize, this.sort.column, this.sort.direction, param).subscribe(res => {
                this.querying = false;
                this.haveNotNull = false;
                this.biTable.total = res.total;
                this.biTable.pageType = this.bi.pageType;
                if (!res.columns) {
                    this.biTable.data = [];
                } else {
                    let columns = [];
                    for (let column of res.columns) {
                        if (column.display) {
                            let titleWidth = column.name.length * 14 + 22;
                            let col: STColumn = {
                                title: {
                                    text: column.name,
                                    optional: "   ",
                                    optionalHelp: column.remark
                                },
                                index: column.name,
                                width: column.width || titleWidth,

                                className: "text-center",
                                iif: (item) => {
                                    return item['show'];
                                },
                                ...{show: true}
                            };
                            if (column.sortable) {
                                col.sort = {
                                    key: column.name,
                                    default: (this.sort.column == column.name) ? this.sort.direction : null
                                };
                            }
                            if (column.type == columnType.STRING) {
                            } else if (column.type == columnType.NUMBER) {
                                col.type = "number";
                            } else if (column.type == columnType.DATE) {
                                col.type = "date";
                                col.width = 180;
                            } else if (column.type == columnType.DRILL) {
                                col.type = "link";
                                col.click = (row) => {
                                    this.modal.create({
                                        nzWrapClassName: "modal-lg",
                                        nzKeyboard: true,
                                        nzMaskClosable: false,
                                        nzStyle: {top: "30px"},
                                        nzTitle: column.name,
                                        nzContent: DrillComponent,
                                        nzComponentParams: {
                                            drillCode: column.code,
                                            bi: this.bi,
                                            row: row
                                        },
                                        nzFooter: null
                                    });
                                };
                            }
                            columns.push(col);
                        }
                    }
                    this.columns = columns;
                    this.biTable.data = res.list;

                }
            });
        }
    }

    biTableChange(e) {
        if (e.type == 'sort') {
            this.sort = {
                column: e.sort.column.indexKey
            };
            if (e.sort.value) {
                this.sort.direction = e.sort.value;
            }
            this.query({
                pageIndex: 1,
                pageSize: this.biTable.size
            });
        }
    }

    pageIndexChange(index) {
        this.query({
            pageIndex: index,
            pageSize: this.biTable.size
        });
    }

    pageSizeChange(size) {
        this.biTable.size = size;
        this.query({
            pageIndex: 1,
            pageSize: size
        });
    }

    clearCondition() {
        for (let dimension of this.bi.dimensions) {
            dimension.$value = null;
            dimension.$viewValue = null;
        }
        this.query({
            pageIndex: 1,
            pageSize: this.biTable.size
        })
    }

    //导出报表数据
    exportBiData() {
        let param = this.handlerService.buildDimParam(this.bi);
        if (!param) {
            return;
        }
        this.downloading = true;
        this.dataService.exportExcel(this.bi.id, this.bi.code, param, () => {
            this.downloading = false;
        });
    }


    ngOnDestroy(): void {
        this.router$.unsubscribe();
        this.timer && clearInterval(this.timer);
    }

}
