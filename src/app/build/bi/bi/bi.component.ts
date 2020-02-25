import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {Bi} from "../model/bi.model";
import {NzMessageService} from "ng-zorro-antd";
import {STColumn} from "@delon/abc/table/table.interfaces";
import {BiDataService} from "../service/data.service";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";

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

    opt: any = {
        title: {
            text: ''
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: '#6a7985'
                }
            }
        },
        legend: {
            data: ['邮件营销', '联盟广告', '视频广告', '直接访问', '搜索引擎']
        },
        toolbox: {
            feature: {
                saveAsImage: {}
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: [
            {
                type: 'category',
                boundaryGap: false,
                data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
            }
        ],
        yAxis: [
            {
                type: 'value'
            }
        ],
        series: [
            {
                name: '邮件营销',
                type: 'line',
                stack: '总量',
                areaStyle: {},
                data: [120, 132, 101, 134, 90, 230, 210]
            },
            {
                name: '联盟广告',
                type: 'line',
                stack: '总量',
                areaStyle: {},
                data: [220, 182, 191, 234, 290, 330, 310]
            },
            {
                name: '视频广告',
                type: 'line',
                stack: '总量',
                areaStyle: {},
                data: [150, 232, 201, 154, 190, 330, 410]
            },
            {
                name: '直接访问',
                type: 'line',
                stack: '总量',
                areaStyle: {},
                data: [320, 332, 301, 334, 390, 330, 320]
            },
            {
                name: '搜索引擎',
                type: 'line',
                stack: '总量',
                label: {
                    normal: {
                        show: true,
                        position: 'top'
                    }
                },
                areaStyle: {},
                data: [820, 932, 901, 934, 1290, 1330, 1320]
            }
        ]
    };

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
                    chart.option = this.opt;
                    Object.assign(chart.option, opt);
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

    query() {
        for (let dimension of this.bi.dimensions) {
            if (dimension.notNull && !dimension.$value) {
                this.msg.error(dimension.title + "必填");
                return
            }
        }
        this.haveNotNull = false;
        if (this.bi.table) {
            this.querying = true;
            this.dataService.getBiData(this.name, {name: 233}).subscribe(res => {
                this.querying = false;
                this.columns = [];
                for (let column of res.columns) {
                    this.columns.push({
                        title: column.name,
                        index: column.name,
                        className: "text-center"
                    })
                }
                this.data = res.list;
            })
        }
    }

}
