import {Component, Inject, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {Bi, DimType} from "../model/bi.model";
import {NzMessageService} from "ng-zorro-antd";
import {STColumn} from "@delon/abc/table/table.interfaces";
import {BiDataService} from "../service/data.service";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {STComponent} from "@delon/abc";
import {ChartComponent} from "../chart/chart.component";
import {HandlerService} from "../service/handler.service";

@Component({
    selector: 'app-bi',
    templateUrl: './bi.component.html',
    styleUrls: ["./bi.component.less"],
    styles: []
})
export class BiComponent implements OnInit, OnDestroy {

    bi: Bi;

    name: string;

    columns: STColumn[];

    data: any;

    haveNotNull: boolean = false;

    querying: boolean = false;

    clientWidth = document.body.clientWidth;

    hideCondition: boolean = false;

    @ViewChild("st", {static: false}) st: STComponent;

    @ViewChildren('biChart') biCharts: QueryList<ChartComponent>;

    //page
    index: number = 1;

    size: number = 10;

    total: number = 0;

    private router$: Subscription;

    timer: NodeJS.Timer;

    constructor(private dataService: BiDataService,
                public route: ActivatedRoute,
                private handlerService: HandlerService,
                @Inject(NzMessageService)
                private msg: NzMessageService
    ) {
    }

    ngOnInit() {
        this.router$ = this.route.params.subscribe(params => {
            this.timer && clearInterval(this.timer);
            this.name = params.name;
            this.columns = [];
            this.data = null;
            this.dataService.getBiBuild(this.name).subscribe(res => {
                this.bi = res;
                //维度
                for (let dimension of res.dimensions) {
                    if (dimension.type === DimType.NUMBER_RANGE) {
                        dimension.$value = [];
                    }
                    if (dimension.notNull) {
                        this.haveNotNull = true;
                        return;
                    }
                }
                this.query(1, this.size);
                if (this.bi.refreshTime) {
                    this.timer = setInterval(() => {
                        this.query(this.index, this.size, true, false);
                    }, this.bi.refreshTime * 1000);
                }
            });
        });
    }

    query(pageIndex: number, pageSize: number, updateChart?: boolean, chartLoading: boolean = true) {
        let param = this.handlerService.buildDimParam(this.bi);
        if (!param) {
            return;
        }
        if (updateChart) {
            this.biCharts.forEach(chart => chart.update(chartLoading));
        }
        if (this.bi.table) {
            this.querying = true;
            this.index = pageIndex;
            this.dataService.getBiData(this.bi.id, this.bi.code, pageIndex, pageSize, param).subscribe(res => {
                this.haveNotNull = false;
                this.querying = false;
                this.total = res.total;
                this.columns = [];
                if (!res.columns) {
                    this.columns.push({
                        title: "暂无数据",
                        className: "text-center"
                    });
                    this.data = [];
                } else {
                    this.columns.push({
                        title: 'No',
                        type: 'no',
                        width: '82px',
                        className: "text-center",
                        fixed: "left",
                    });
                    for (let column of res.columns) {
                        let col = {
                            title: column.name,
                            index: column.name,
                            className: "text-center",
                            show: true,
                            iif: () => {
                                return col.show;
                            }
                        };
                        this.columns.push(col);
                    }
                    this.data = res.list;
                }
            });
        }
    }

    pageIndexChange(index) {
        this.query(index, this.size);
    }

    pageSizeChange(size) {
        this.size = size;
        this.query(1, size);
    }

    clearCondition() {
        for (let dimension of this.bi.dimensions) {
            dimension.$value = null;
            dimension.$viewValue = null;
        }
    }

    //导出报表数据
    exportBiData() {
        let param = this.handlerService.buildDimParam(this.bi);
        if (!param) {
            return;
        }
        this.dataService.exportExcel(this.bi.id, this.bi.code, param);
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
        this.timer && clearInterval(this.timer);
    }

}
