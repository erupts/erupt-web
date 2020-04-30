import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {Bi, DimType} from "../model/bi.model";
import {NzMessageService} from "ng-zorro-antd";
import {STColumn} from "@delon/abc/table/table.interfaces";
import {BiDataService} from "../service/data.service";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {DatePipe} from "@angular/common";
import {RestPath} from "../../erupt/model/erupt.enum";

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

    stConfig = {
        url: null,
        stPage: {
            placement: "center",
            pageSizes: [10, 20, 30, 50, 100],
            showSize: true,
            showQuickJumper: true,
            total: true,
            toTop: true,
            front: false
        },
        req: {
            param: {},
            headers: {},
            method: "POST",
            allInBody: true,
            reName: {
                pi: 1,
                ps: 10
            }
        },
        multiSort: {
            key: "_sort",
            separator: ",",
            nameSeparator: " "
        }
    };

    ngOnInit() {
        this.router$ = this.route.params.subscribe(params => {
            this.name = params.name;
            this.columns = [];
            this.data = null;
            this.dataService.getBiBuild(this.name).subscribe(res => {
                this.bi = res;
                //维度
                for (let dimension of res.dimensions) {
                    if (dimension.type == DimType.NUMBER_RANGE) {
                        dimension.$value = [];
                    }
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
                    case DimType.NUMBER_RANGE:
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
                return
            }
            if (Array.isArray(dimension.$value)) {
                if (!dimension.$value[0] && !dimension.$value[1]) {
                    this.msg.error(dimension.title + "必填");
                    return
                }
            }
        }
        this.haveNotNull = false;
        if (this.bi.table) {
            this.querying = true;
            // this.stConfig.url = RestPath.bi + this.name + "/data";
            this.dataService.getBiData(this.name, param).subscribe(res => {
                this.querying = false;
                this.columns = [];
                if (!res.columns) {
                    this.columns.push({
                        title: "暂无数据",
                        className: "text-center"
                    })
                } else {
                    this.columns.push({
                        title: '序号',
                        type: 'no',
                        width: '80px',
                        className: "text-center",
                        fixed: "left"
                    });
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
