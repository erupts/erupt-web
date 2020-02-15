import {Component, Inject, OnInit} from '@angular/core';
import {DataService} from "@shared/service/data.service";
import {Bi} from "../model/bi.model";
import {NzMessageService} from "ng-zorro-antd";
import {STColumn} from "@delon/abc/table/table.interfaces";

@Component({
    selector: 'app-bi',
    templateUrl: './bi.component.html',
    styleUrls: ["./bi.component.less"],
    styles: []
})
export class BiComponent implements OnInit {

    bi: Bi;

    columns: STColumn[];

    data: any;

    clientWidth = document.body.clientWidth;

    constructor(private dataService: DataService,
                @Inject(NzMessageService)
                private msg: NzMessageService
    ) {
    }

    ngOnInit() {
        this.dataService.getBiBuild("test").subscribe(res => {
            this.bi = res;
            //图表
            for (let chart of this.bi.charts) {
                chart.loading = true;
                let opt = chart.chartOption;
                if (opt) {
                    opt = JSON.parse(opt);
                } else {
                    opt = {};
                }
                chart.option = {
                    backgroundColor: '#2c343c',
                    title: {
                        text: ''
                    },
                    tooltip: {
                        trigger: 'item',
                        formatter: '{a} <br/>{b} : {c} ({d}%)'
                    },

                    visualMap: {
                        show: false,
                        min: 80,
                        max: 600,
                        inRange: {
                            colorLightness: [0, 1]
                        }
                    },
                    series: [
                        {
                            name: '访问来源',
                            type: 'pie',
                            radius: '55%',
                            center: ['50%', '50%'],
                            data: [
                                {value: 335, name: '直接访问'},
                                {value: 310, name: '邮件营销'},
                                {value: 274, name: '联盟广告'},
                                {value: 235, name: '视频广告'},
                                {value: 400, name: '搜索引擎'}
                            ].sort(function (a, b) { return a.value - b.value; }),
                            roseType: 'radius',
                            label: {
                                color: 'rgba(255, 255, 255, 0.3)'
                            },
                            labelLine: {
                                lineStyle: {
                                    color: 'rgba(255, 255, 255, 0.3)'
                                },
                                smooth: 0.2,
                                length: 10,
                                length2: 20
                            },
                            itemStyle: {
                                color: '#c23531',
                                shadowBlur: 200,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            },

                            animationType: 'scale',
                            animationEasing: 'elasticOut',
                            animationDelay: function (idx) {
                                return Math.random() * 200;
                            }
                        }
                    ]
                };
                Object.assign(chart.option, opt);
            }
            //维度
            for (let dimension of res.dimensions) {
                if (dimension.notNull) {
                    return;
                }
            }

            this.query();
        })
    }

    query() {
        for (let dimension of this.bi.dimensions) {
            if (dimension.notNull && !dimension.$value) {
                this.msg.error(dimension.title + "必填");
                return
            }
        }
        this.dataService.getBiData("test", {name: 233}).subscribe(res => {
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
