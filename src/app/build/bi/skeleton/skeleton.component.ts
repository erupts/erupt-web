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
import {CodeEditorComponent} from "../../erupt/components/code-editor/code-editor.component";
import {EruptIframeComponent} from "@shared/component/iframe.component";

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

    clientHeight: number = document.body.clientHeight;

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
                                    let model = this.modal.create({
                                        nzWrapClassName: "modal-lg",
                                        nzKeyboard: true,
                                        nzMaskClosable: false,
                                        nzStyle: {top: "30px"},
                                        nzTitle: column.name,
                                        nzContent: DrillComponent,
                                        nzFooter: null
                                    });
                                    model.getContentComponent().bi = this.bi;
                                    model.getContentComponent().drillCode = column.code;
                                    model.getContentComponent().row = row;
                                };
                            } else if (column.type == columnType.LONG_TEXT) {
                                col.type = "link"
                                col.format = (item: any) => {
                                    if (item[column.name]) {
                                        return `<i class='fa fa-file-text' aria-hidden='true' title=''></i>`;
                                    } else {
                                        return null;
                                    }
                                }
                                col.click = (item) => {
                                    let model = this.modal.create({
                                        nzWrapClassName: "modal-lg",
                                        nzKeyboard: true,
                                        nzBodyStyle: {
                                            padding: '0',
                                        },
                                        nzMaskClosable: false,
                                        nzStyle: {top: "30px"},
                                        nzTitle: column.name,
                                        nzContent: CodeEditorComponent,
                                        nzFooter: null
                                    });
                                    // @ts-ignore
                                    model.getContentComponent().edit = {$value: item[column.name]}
                                    model.getContentComponent().height = 500;
                                }
                            } else if (column.type == columnType.LINK || column.type == columnType.LINK_DIALOG) {
                                col.type = "link"
                                col.click = (item) => {
                                    if (column.type == columnType.LINK) {
                                        window.open(item[column.name]);
                                    } else {
                                        let ref = this.modal.create({
                                            nzWrapClassName: "modal-lg modal-body-nopadding",
                                            nzStyle: {top: "20px"},
                                            nzMaskClosable: false,
                                            nzKeyboard: true,
                                            nzFooter: null,
                                            nzTitle: column.name,
                                            nzContent: EruptIframeComponent
                                        });
                                        ref.getContentComponent().url = item[column.name];
                                    }
                                };
                                col.format = (item: any) => {
                                    if (item[column.name]) {
                                        return "<i class='fa fa-link' aria-hidden='true' title=''></i>";
                                    } else {
                                        return null;
                                    }
                                };
                            } else if (column.type == columnType.PERCENT) {
                                col.type = "widget"
                                col.className = "text-center"
                                col.widget = {
                                    type: 'progress', params: ({record}) => ({value: record[column.name]})
                                };
                                col.width = "160px"
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
            if (dimension.type == DimType.NUMBER_RANGE) {
                dimension.$value = [];
            } else {
                dimension.$value = null;
            }
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
