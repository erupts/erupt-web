import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {Bi, DimType} from "../model/bi.model";
import {NzMessageService} from "ng-zorro-antd";
import {STColumn} from "@delon/abc/table/table.interfaces";
import {BiDataService} from "../service/data.service";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {DatePipe} from "@angular/common";

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
                //图表
                for (let chart of this.bi.charts) {
                    chart.loading = false;
                    let opt = chart.chartOption;
                    if (opt) {
                        opt = JSON.parse(opt);
                    } else {
                        opt = {};
                    }
                }
                //维度
                for (let dimension of res.dimensions) {
                    if (dimension.notNull) {
                        this.haveNotNull = true;
                        return;
                    }
                }
                this.query();
            })
        });
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
    }

    private datePipe: DatePipe = new DatePipe("zh-cn");

    query() {
        let param = {};
        for (let dimension of this.bi.dimensions) {
            let val = dimension.$value;
            let format;
            switch (dimension.type) {
                case DimType.DATE:
                    format = "yyyy-MM-dd";
                    break;
                case DimType.DATETIME:
                    format = "yyyy-MM-dd HH:mm:ss";
                    break;
                case DimType.TIME:
                    format = "HH:mm:ss";
                    break;
                case DimType.YEAR:
                    format = "yyyy";
                    break;
                case DimType.MONTH:
                    format = "yyyy-MM";
                    break;
                case DimType.WEEK:
                    format = "yyyy-ww";
                    break;
            }
            if (format && val) {
                val = this.datePipe.transform(val, format);
            }
            param[dimension.code] = val || null;
            if (dimension.notNull && !dimension.$value) {
                this.msg.error(dimension.title + "必填");
                return
            }
        }
        this.haveNotNull = false;
        if (this.bi.table) {
            this.querying = true;
            this.dataService.getBiData(this.name, param).subscribe(res => {
                this.querying = false;
                this.columns = [];
                if (!res.columns) {
                    this.columns.push({
                        title: "暂无数据",
                        className: "text-center"
                    })
                } else {
                    for (let column of res.columns) {
                        this.columns.push({
                            title: column.name,
                            index: column.name,
                            className: "text-center"
                        })
                    }
                }
                this.data = res.list;
            })
        }
    }

}
