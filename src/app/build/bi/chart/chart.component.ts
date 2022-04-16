import {Component, ElementRef, EventEmitter, Inject, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
    Area,
    Bubble,
    Funnel,
    GroupBar,
    GroupColumn,
    Heatmap,
    Line,
    PercentageStackArea,
    PercentageStackBar,
    Pie,
    Radar,
    Ring,
    Rose,
    Scatter,
    StackArea,
    StackColumn,
    StepLine,
    Waterfall,
    WordCloud
} from '@antv/g2plot';
import {Bi, Chart, ChartType} from "../model/bi.model";
import {BiDataService} from "../service/data.service";
import BasePlot from "@antv/g2plot/lib/base/plot";
import {NzMessageService} from "ng-zorro-antd";
import {HandlerService} from "../service/handler.service";

// 图表版本暂不能升级，g2plot 需要 TypeScript 4.0版本，但是 angular8 又不支持 ts 4
@Component({
    selector: 'bi-chart',
    templateUrl: "./chart.component.html",
    styleUrls: ['./chart.component.less'],
    styles: []
})
export class ChartComponent implements OnInit, OnDestroy {

    @Input() chart: Chart;

    @Input() bi: Bi;

    @Output() buildDimParam = new EventEmitter();

    plot: BasePlot;

    chartType = ChartType;

    ready: boolean = true;

    src: string;

    data: any[] = [];

    dataKeys: string[] = [];

    constructor(private ref: ElementRef, private biDataService: BiDataService,
                private handlerService: HandlerService,
                @Inject(NzMessageService) private msg: NzMessageService) {
    }

    ngOnInit() {
        if (this.chart.chartOption) {
            this.chart.chartOption = JSON.parse(this.chart.chartOption);
        }
        this.init();
    }


    init() {
        let param = this.handlerService.buildDimParam(this.bi, false);
        for (let dimension of this.bi.dimensions) {
            if (dimension.notNull && (!param || null === param[dimension.code])) {
                this.ready = false;
                return;
            }
        }
        this.ready = true;
        if (this.chart.type == ChartType.tpl) {
            this.src = this.biDataService.getChartTpl(this.chart.id, this.bi.code, param);
        } else {
            this.chart.loading = true;
            this.biDataService.getBiChart(this.bi.code, this.chart.id, param).subscribe(data => {
                this.chart.loading = false;
                if (this.chart.type == ChartType.table || this.chart.type == ChartType.Number) {
                    if (data[0]) {
                        this.dataKeys = Object.keys(data[0]);
                    }
                    this.data = data;
                } else {
                    let element = this.ref.nativeElement.querySelector("#" + this.chart.code);
                    this.render(element, data);
                }
            });
        }
    }

    ngOnDestroy(): void {
        if (this.plot) {
            this.plot.destroy();
        }
    }

    update(loading: boolean) {
        this.handlerService.buildDimParam(this.bi, true);
        if (this.plot) {
            if (loading) {
                this.chart.loading = true;
            }
            this.biDataService.getBiChart(this.bi.code, this.chart.id,
                this.handlerService.buildDimParam(this.bi)).subscribe(data => {
                if (this.chart.loading) {
                    this.chart.loading = false;
                }
                this.plot.changeData(data, true);
            });
        } else {
            this.init();
        }
    }

    downloadChart() {
        if (!this.plot) {
            this.init();
        }
        let canvas = this.ref.nativeElement.querySelector("#" + this.chart.code).querySelector("canvas");
        let src = canvas.toDataURL("image/png");
        let anchor = document.createElement('a');
        if ('download' in anchor) {
            anchor.style.visibility = 'hidden';
            anchor.href = src;
            anchor.download = this.chart.name;
            document.body.appendChild(anchor);
            let evt = document.createEvent('MouseEvents');
            evt.initEvent('click', true, true);
            anchor.dispatchEvent(evt);
            document.body.removeChild(anchor);
        } else {
            window.open(src);
        }
    }

    render(element, data: any[]) {
        if (this.plot) {
            this.plot.destroy();
            this.plot = null;
        }
        let keys = Object.keys(data[0]);
        let x = keys[0];
        let y = keys[1];
        let series = keys[2];
        let size = keys[3];
        let props = {
            data: data,
            xField: x,
            yField: y,
            // theme: 'dark',
        };
        if (this.chart.chartOption) {
            Object.assign(props, this.chart.chartOption);
        }
        switch (this.chart.type) {
            case ChartType.Line:
                this.plot = new Line(element, Object.assign(props, {
                    seriesField: series
                }));
                break;
            case ChartType.StepLine:
                this.plot = new StepLine(element, Object.assign(props, {
                    seriesField: series
                }));
                break;
            case ChartType.Bar:
                this.plot = new GroupBar(element, Object.assign(props, {
                    groupField: series,
                }));
                break;
            case ChartType.PercentStackedBar:
                // @ts-ignore
                this.plot = new PercentageStackBar(element, Object.assign(props, {
                    stackField: series,
                }));
                break;
            case ChartType.Waterfall:
                this.plot = new Waterfall(element, Object.assign(props, {}));
                break;
            case ChartType.Column:
                this.plot = new GroupColumn(element, Object.assign(props, {
                    groupField: series
                }));
                break;
            case ChartType.StackedColumn:
                this.plot = new StackColumn(element, Object.assign(props, {
                    stackField: series
                }));
                break;
            case ChartType.Area:
                if (series) {
                    this.plot = new StackArea(element, Object.assign(props, {
                        stackField: series
                    }));
                } else {
                    this.plot = new Area(element, props);
                }
                break;
            case ChartType.PercentageArea:
                // @ts-ignore
                this.plot = new PercentageStackArea(element, Object.assign(props, {
                    stackField: series,
                }));
                break;
            case ChartType.Pie:
                this.plot = new Pie(element, Object.assign(props, {
                    angleField: y,
                    colorField: x,
                }));
                break;
            case ChartType.Ring:
                this.plot = new Ring(element, Object.assign(props, {
                    angleField: y,
                    colorField: x,
                }));
                break;
            case ChartType.Rose:
                this.plot = new Rose(element, Object.assign(props, {
                    radiusField: y,
                    categoryField: x,
                    colorField: x,
                    stackField: series,
                }));
                break;
            case ChartType.Funnel:
                this.plot = new Funnel(element, Object.assign(props, {}));
                break;
            case ChartType.Radar:
                this.plot = new Radar(element, Object.assign(props, {
                    angleField: x,
                    radiusField: y,
                    seriesField: series,
                    line: {
                        visible: true,
                    },
                    point: {
                        visible: true,
                        shape: 'circle',
                    },
                }));
                break;
            case ChartType.Scatter:
                this.plot = new Scatter(element, Object.assign(props, {
                    colorField: series
                }));
                break;
            case ChartType.Bubble:
                this.plot = new Bubble(element, Object.assign(props, {
                    colorField: series,
                    sizeField: size
                }));
                break;
            //TODO 升级G2plot版本再添加如下类型图表支持
            case ChartType.WordCloud:
                this.plot = new WordCloud(element, Object.assign(props, {
                    wordField: x,
                    weightField: y,
                    wordStyle: {
                        fontSize: [20, 100],
                        // color: (word, weight) => {
                        //     return arr[Math.floor(Math.random() * (arr.length - 1))];
                        // },
                    },
                }));
                break;
            case ChartType.Heatmap:
                this.plot = new Heatmap(element, Object.assign(props, {
                    colorField: series,
                    sizeField: size || series,
                    legend: null
                }));
                break;
            case ChartType.DensityHeatmap:

                break;
        }
        this.plot && this.plot.render();
    }


}
