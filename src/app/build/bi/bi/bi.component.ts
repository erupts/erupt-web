import {Component, Inject, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {Bi, DimType} from "../model/bi.model";
import {NzMessageService} from "ng-zorro-antd";
import {STColumn} from "@delon/abc/table/table.interfaces";
import {BiDataService} from "../service/data.service";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {DatePipe} from "@angular/common";
import {STComponent} from "@delon/abc";
import {ChartComponent} from "../chart/chart.component";

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

    @ViewChild("st", {static: false})
    st: STComponent;

    @ViewChildren('biChart') biCharts: QueryList<ChartComponent>;

    //page
    index: number = 1;

    size: number = 10;

    total: number = 0;

    private router$: Subscription;

    constructor(private dataService: BiDataService,
                public route: ActivatedRoute,
                @Inject(NzMessageService)
                private msg: NzMessageService
    ) {
    }

    ngOnInit() {
        this.router$ = this.route.params.subscribe(params => {
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
                this.query(1, 20);
                // this.chartQuery();
            });
        });
    }

    //导出报表数据
    exportBiData() {
        let param = this.buildDimParam();
        if (!param) {
            return;
        }
        this.dataService.exportExcel(this.name, param);
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
    }

    private datePipe: DatePipe = new DatePipe("zh-cn");

    query(pageIndex: number, pageSize: number) {
        let param = this.buildDimParam();
        if (!param) {
            return;
        }
        if (this.bi.table) {
            this.querying = true;
            this.index = pageIndex;
            this.dataService.getBiData(this.name, pageIndex, pageSize, param).subscribe(res => {
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

    print() {
        window.print();
    }

    chartQuery() {
        this.biCharts.forEach(chart => {
            chart.query();
        });
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

    buildDimParam(): object {
        let param = {};
        for (let dimension of this.bi.dimensions) {
            let val = dimension.$value;
            if (val) {
                switch (dimension.type) {
                    case DimType.DATE_RANGE:
                        val[0] = this.datePipe.transform(val[0], "yyyy-MM-dd");
                        val[1] = this.datePipe.transform(val[1], "yyyy-MM-dd");
                        break;
                    case DimType.DATETIME_RANGE:
                        val[0] = this.datePipe.transform(val[0], "yyyy-MM-dd HH:mm:ss");
                        val[1] = this.datePipe.transform(val[1], "yyyy-MM-dd HH:mm:ss");
                        break;
                    case DimType.DATE:
                        val = this.datePipe.transform(val, "yyyy-MM-dd");
                        break;
                    case DimType.DATETIME:
                        val = this.datePipe.transform(val, "yyyy-MM-dd HH:mm:ss");
                        break;
                    case DimType.TIME:
                        val = this.datePipe.transform(val, "HH:mm:ss");
                        break;
                    case DimType.YEAR:
                        val = this.datePipe.transform(val, "yyyy");
                        break;
                    case DimType.MONTH:
                        val = this.datePipe.transform(val, "yyyy-MM");
                        break;
                    case DimType.WEEK:
                        val = this.datePipe.transform(val, "yyyy-ww");
                        break;
                }
            }
            param[dimension.code] = val || null;
            if (dimension.notNull && !dimension.$value) {
                this.msg.error(dimension.title + "必填");
                return;
            }
            if (dimension.notNull && Array.isArray(dimension.$value)) {
                if (!dimension.$value[0] && !dimension.$value[1]) {
                    this.msg.error(dimension.title + "必填");
                    return;
                }
            }
        }
        return param;
    }

}
