import {Component, ElementRef, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Area,AreaOptions, Bar,  BarOptions, Chord, ChordOptions, Column, ColumnOptions, Funnel, FunnelOptions, Line, LineOptions, Pie, PieOptions, Radar, RadarOptions, RadialBar, RadialBarOptions, Rose, RoseOptions, Sankey, SankeyOptions, Scatter, ScatterOptions, Waterfall, WaterfallOptions, WordCloud, WordCloudOptions} from "@antv/g2plot";
import {Bi, Chart, ChartType} from "../model/bi.model";
import {BiDataService} from "../service/data.service";
import {HandlerService} from "../service/handler.service";
import {NzMessageService} from "ng-zorro-antd/message";
import {
    Area,
    Bar,
    Chord,
    Column,
    Funnel,
    Line,
    Pie,
    Radar,
    RadialBar,
    Rose,
    Sankey,
    Scatter,
    Waterfall,
    WordCloud
} from "@antv/g2plot";
import {ChartTableComponent} from "../chart-table/chart-table.component";

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

    @ViewChild('chartTable', {static: false}) chartTable: ChartTableComponent | null;

    plot;

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
                if (this.chart.type == ChartType.Number) {
                    if (data[0]) {
                        this.dataKeys = Object.keys(data[0]);
                    }
                    this.data = data;
                } else if (this.chart.type == ChartType.table) {
                    this.chartTable.render(data);
                } else {
                    this.render(data);
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
                this.plot.changeData(data);
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

    render(data: any[]) {
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
            slider: {},
            appendPadding: 16,
            legend: {
                position: "bottom"
            }
        };
        if (this.chart.chartOption) {
            Object.assign(props, this.chart.chartOption);
        }

        switch (this.chart.type) {
            case ChartType.Line:
                // @ts-ignore
                this.plot = new Line(
                    this.chart.code,
                    Object.assign(props, {
                        seriesField: series
                    }) as LineOptions
                );
                break;
            case ChartType.StepLine:
                // @ts-ignore
                this.plot = new Line(
                    this.chart.code,
                    Object.assign(props, {
                        seriesField: series,
                        stepType: "vh"
                    }) as LineOptions
                );
                break;
            case ChartType.Bar:
                // @ts-ignore
                this.plot = new Bar(
                    this.chart.code,
                    Object.assign(props, {
                        seriesField: series
                    }) as BarOptions
                );
                break;
            case ChartType.PercentStackedBar:
                // @ts-ignore
                this.plot = new Bar(
                    this.chart.code,
                    Object.assign(props, {
                        stackField: series,
                        isPercent: true,
                        isStack: true
                    }) as BarOptions
                );
                break;
            case ChartType.Waterfall:
                // @ts-ignore
                this.plot = new Waterfall(
                    this.chart.code,
                    Object.assign(props, {
                        legend: false,
                        label: {
                            style: { fontSize: 10 },
                            layout: [{ type: "interval-adjust-position" }]
                        }
                    }) as WaterfallOptions
                );
                break;
            case ChartType.Column:
                // @ts-ignore
                this.plot = new Column(
                    this.chart.code,
                    Object.assign(props, {
                        isGroup: true,
                        seriesField: series
                    }) as ColumnOptions
                );
                break;
            case ChartType.StackedColumn:
                // @ts-ignore
                this.plot = new Column(
                    this.chart.code,
                    Object.assign(props, {
                        isStack: true,
                        seriesField: series,

                        slider: {}
                    }) as ColumnOptions
                );
                break;
            case ChartType.Area:
                // @ts-ignore
                this.plot = new Area(
                    this.chart.code,
                    Object.assign(props, {
                        seriesField: series
                    }) as AreaOptions
                );
                break;
            case ChartType.PercentageArea:
                // @ts-ignore
                this.plot = new Area(
                    this.chart.code,
                    Object.assign(props, {
                        seriesField: series,
                        isPercent: true
                    }) as AreaOptions
                );
                break;
            case ChartType.Pie:
                // @ts-ignore
                this.plot = new Pie(
                    this.chart.code,
                    Object.assign(props, {
                        angleField: y,
                        colorField: x
                    }) as PieOptions
                );
                break;
            case ChartType.Ring:
                // @ts-ignore
                this.plot = new Pie(
                    this.chart.code,
                    Object.assign(props, {
                        angleField: y,
                        colorField: x,
                        innerRadius: 0.6,
                        radius: 1
                    }) as PieOptions
                );
                break;
            case ChartType.Rose:
                // @ts-ignore
                this.plot = new Rose(
                    this.chart.code,
                    Object.assign(props, {
                        seriesField: series,
                        isGroup: !!series,
                        radius: 0.9,
                        label: {
                            offset: -15
                        },
                        interactions: [
                            {
                                type: "element-active"
                            }
                        ]
                    }) as RoseOptions
                );
                break;
            case ChartType.Funnel:
                // @ts-ignore
                this.plot = new Funnel(
                    this.chart.code,
                    Object.assign(props, {
                        seriesField: series,
                        appendPadding: [12, 38],
                        shape: "pyramid"
                    }) as FunnelOptions
                );
                break;
            case ChartType.Radar:
                // @ts-ignore
                this.plot = new Radar(
                    this.chart.code,
                    Object.assign(props, {
                        seriesField: series,
                        point: {
                            size: 2
                        },
                        xAxis: {
                            line: null,
                            tickLine: null,
                            grid: {
                                line: {
                                    style: {
                                        lineDash: null
                                    }
                                }
                            }
                        },
                        yAxis: {
                            line: null,
                            tickLine: null,
                            grid: {
                                line: {
                                    type: "line",
                                    style: {
                                        lineDash: null
                                    }
                                },
                                alternateColor: "rgba(0, 0, 0, 0.04)"
                            }
                        },
                        area: {}
                    }) as RadarOptions
                );
                break;
            case ChartType.Scatter:
                // @ts-ignore
                this.plot = new Scatter(
                    this.chart.code,
                    Object.assign(props, {
                        colorField: series,
                        shape: "circle",
                        brush: {
                            enabled: true
                        },
                        yAxis: {
                            nice: true,
                            line: {
                                style: {
                                    stroke: "#aaa"
                                }
                            }
                        },
                        xAxis: {
                            line: {
                                style: {
                                    stroke: "#aaa"
                                }
                            }
                        }
                    }) as ScatterOptions
                );
                break;
            case ChartType.Bubble:
                // @ts-ignore
                this.plot = new Scatter(
                    this.chart.code,
                    Object.assign(props, {
                        colorField: series,
                        sizeField: size,
                        size: [3, 36],
                        shape: "circle",
                        brush: {
                            enabled: true
                        }
                    }) as ScatterOptions
                );
                break;

            case ChartType.WordCloud:
                // @ts-ignore
                this.plot = new WordCloud(
                    this.chart.code,
                    Object.assign(props, {
                        wordField: x,
                        weightField: y,
                        colorField: series,
                        wordStyle: {}
                    }) as WordCloudOptions
                );
                break;
            case ChartType.Sankey:
                // @ts-ignore
                this.plot = new Sankey(
                    this.chart.code,
                    Object.assign(props, {
                        sourceField: x,
                        weightField: y,
                        targetField: series,
                        nodeDraggable: true,
                        nodeWidthRatio: 0.008,
                        nodePaddingRatio: 0.03
                    }) as SankeyOptions
                );
                break;
            case ChartType.Chord:
                // @ts-ignore
                this.plot = new Chord(
                    this.chart.code,
                    Object.assign(props, {
                        sourceField: x,
                        weightField: y,
                        targetField: series
                    }) as ChordOptions
                );
                break;
            case ChartType.RadialBar:
                // @ts-ignore
                this.plot = new RadialBar(
                    this.chart.code,
                    Object.assign(props, {
                        colorField: series,
                        isStack: true,
                        maxAngle: 270
                    }) as RadialBarOptions
                );
                break;
        }
        this.plot && this.plot.render();
    }


}
