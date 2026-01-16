import {AfterViewInit, Component, ElementRef, inject, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
    Area,
    Bar,
    Chord,
    Column,
    Funnel,
    Gauge,
    Line,
    Pie,
    Radar,
    RadialBar,
    Rose,
    Sankey,
    Scatter,
    Waterfall,
    WordCloud
} from '@antv/g2plot';
import {NZ_MODAL_DATA} from 'ng-zorro-antd/modal';
import {CubeMeta} from "../../cube/cube.model";
import {CubeKey, ReportDSL, ReportType} from "../../cube/dashboard.model";

@Component({
    standalone: false,
    selector: 'app-cube-puzzle-config',
    templateUrl: './cube-puzzle-report-config.html',
    styleUrl: './cube-puzzle-report-config.less'
})
export class CubePuzzleReportConfig implements OnInit, AfterViewInit, OnDestroy {

    readonly nzModalData = inject(NZ_MODAL_DATA, {optional: true});

    @Input() cubeMeta: CubeMeta;

    @Input() reportDSL: ReportDSL;

    @ViewChild('chartContainer', {static: false}) chartContainer: ElementRef;

    chart: any;

    tableColumns: string[] = [];

    chartData = [
        {input: '分类一', count: 27, date: 'A'},
        {input: '分类二', count: 25, date: 'A'},
        {input: '分类三', count: 18, date: 'A'},
        {input: '分类四', count: 15, date: 'A'},
        {input: '分类五', count: 10, date: 'A'},
        {input: '分类一', count: 7, date: 'B'},
        {input: '分类二', count: 5, date: 'B'},
        {input: '分类三', count: 3, date: 'B'},
        {input: '分类四', count: 5, date: 'B'},
        {input: '分类五', count: 10, date: 'B'},
    ];

    ngOnInit() {
        if (this.nzModalData) {
            if (this.nzModalData.cubeMeta) {
                this.cubeMeta = this.nzModalData.cubeMeta;
            }
            if (this.nzModalData.config) {
                this.reportDSL = {...this.reportDSL, ...this.nzModalData.config};
            }
        }
        if (!this.reportDSL.ui) {
            this.reportDSL.ui = {
                showXAxis: true,
                showYAxis: true,
                showTooltip: true
            };
        }
        if (this.reportDSL.type === ReportType.TABLE) {
            if (!this.reportDSL.cube[CubeKey.xField]) {
                this.reportDSL.cube[CubeKey.xField] = [this.cubeMeta.dimensions?.[0]?.code];
            }
            if (!this.reportDSL.cube[CubeKey.yField]) {
                this.reportDSL.cube[CubeKey.yField] = [this.cubeMeta.measures?.[0]?.code];
            }
        } else {
            if (!this.reportDSL.cube[CubeKey.xField]) {
                this.reportDSL.cube[CubeKey.xField] = this.cubeMeta.dimensions?.[0]?.code;
            }
            if (!this.reportDSL.cube[CubeKey.yField]) {
                this.reportDSL.cube[CubeKey.yField] = this.cubeMeta.measures?.[0]?.code;
            }
        }
    }

    ngAfterViewInit() {
        this.renderChart();
    }

    ngOnDestroy() {
        if (this.chart) {
            this.chart.destroy();
        }
    }

    renderChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        if (this.reportDSL.type === ReportType.TABLE) {
            this.tableColumns = [];
            const xFields = this.reportDSL.cube[CubeKey.xField];
            if (Array.isArray(xFields)) {
                this.tableColumns.push(...xFields);
            } else if (xFields) {
                this.tableColumns.push(xFields as string);
            }
            const yFields = this.reportDSL.cube[CubeKey.yField];
            if (Array.isArray(yFields)) {
                this.tableColumns.push(...yFields);
            } else if (yFields) {
                this.tableColumns.push(yFields as string);
            }
            return;
        }
        const commonConfig = {
            data: this.chartData,
            ...this.reportDSL.cube,
            ...this.reportDSL.ui
        };
        if (this.reportDSL.ui["legendPosition"]) {
            commonConfig["legend"] = {
                layout: 'horizontal',
                position: this.reportDSL.ui["legendPosition"],
            };
        }
        if (this.reportDSL.ui["showLabel"]) {
            commonConfig["label"] = {
                position: this.reportDSL.type === ReportType.PIE ? 'outer' : 'middle',
            };
        }
        if (this.reportDSL.ui["showSlider"]) {
            commonConfig["slider"] = {};
        }
        if (this.reportDSL.ui["showScrollbar"]) {
            commonConfig["scrollbar"] = {};
        }
        if (this.reportDSL.ui["showXAxis"] === false) {
            commonConfig["xAxis"] = false;
        }
        if (this.reportDSL.ui["showYAxis"] === false) {
            commonConfig["yAxis"] = false;
        }
        if (this.reportDSL.ui["showTooltip"] === false) {
            commonConfig["tooltip"] = false;
        }
        if (this.reportDSL.ui["theme"]) {
            commonConfig["theme"] = this.reportDSL.ui["theme"];
        }
        if (this.reportDSL.ui["color"] && this.reportDSL.ui["color"].length > 0) {
            commonConfig["color"] = this.reportDSL.ui["color"];
        }
        console.log(commonConfig);

        switch (this.reportDSL.type) {
            case ReportType.LINE:
                this.chart = new Line(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                    seriesField: this.reportDSL.cube[CubeKey.seriesField] as string,
                    stepType: this.reportDSL.ui["stepType"] ? 'hv' : undefined,
                });
                break;
            case ReportType.AREA:
                this.chart = new Area(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                    seriesField: this.reportDSL.cube[CubeKey.seriesField] as string,
                });
                break;
            case ReportType.COLUMN:
                this.chart = new Column(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                    seriesField: this.reportDSL.cube[CubeKey.seriesField] as string,
                });
                break;
            case ReportType.BAR:
                this.chart = new Bar(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                    seriesField: this.reportDSL.cube[CubeKey.seriesField] as string,
                });
                break;
            case ReportType.PIE:
                this.chart = new Pie(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    angleField: this.reportDSL.cube[CubeKey.yField] as string,
                    colorField: this.reportDSL.cube[CubeKey.xField] as string,
                    radius: this.reportDSL.ui["innerRadius"] ? 1 : 0.8,
                    innerRadius: this.reportDSL.ui["innerRadius"] || 0,
                    label: this.reportDSL.ui["showLabel"] ? {type: 'outer'} : false
                });
                break;
            case ReportType.SCATTER:
                this.chart = new Scatter(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                    colorField: this.reportDSL.cube[CubeKey.seriesField] as string,
                });
                break;
            case ReportType.RADAR:
                this.chart = new Radar(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                    seriesField: this.reportDSL.cube[CubeKey.seriesField] as string,
                });
                break;
            case ReportType.FUNNEL:
                this.chart = new Funnel(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                });
                break;
            // case ReportType.DUAL_AXES:
            //     this.chart = new DualAxes(this.chartContainer.nativeElement, {
            //         ...commonConfig,
            //         xField: this.reportDSL.cube[CubeKey.xField] as string,
            //         yField: [this.reportDSL.cube[CubeKey.yField] as string, this.reportDSL.cube['yField2'] as string],
            //         geometryOptions: [
            //             {geometry: 'column'},
            //             {geometry: 'line'},
            //         ],
            //     });
            //     break;
            case ReportType.GAUGE:
                this.chart = new Gauge(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    percent: (this.chartData && this.chartData.length > 0) ? (this.chartData[0][this.reportDSL.cube[CubeKey.yField] as string] || this.chartData[0].count || 0) / 100 : 0,
                    range: {
                        color: 'l(0) 0:#B8E1FF 1:#3D76DD',
                    },
                    startAngle: Math.PI,
                    endAngle: 2 * Math.PI,
                    indicator: {
                        pointer: {
                            style: {
                                stroke: '#D0D0D0',
                            },
                        },
                        pin: {
                            style: {
                                stroke: '#D0D0D0',
                            },
                        },
                    },
                    axis: {
                        label: {
                            formatter(v) {
                                return Number(v) * 100;
                            },
                        },
                        subTickLine: {
                            count: 3,
                        },
                    },
                    statistic: {
                        content: {
                            formatter: ({percent}) => `Rate: ${(percent * 100).toFixed(0)}%`,
                            style: {
                                color: 'rgba(0,0,0,0.65)',
                                fontSize: '24px',
                            },
                        },
                    },
                });
                break;
            case ReportType.WATERFALL:
                this.chart = new Waterfall(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                });
                break;
            case ReportType.WORD_CLOUD:
                this.chart = new WordCloud(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    wordField: this.reportDSL.cube[CubeKey.xField] as string,
                    weightField: this.reportDSL.cube[CubeKey.yField] as string,
                    colorField: this.reportDSL.cube[CubeKey.xField] as string,
                    wordStyle: {
                        fontFamily: 'Verdana',
                        fontSize: [24, 80],
                    },
                });
                break;
            case ReportType.ROSE:
                this.chart = new Rose(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                    seriesField: this.reportDSL.cube[CubeKey.seriesField] as string,
                    radius: 0.9,
                });
                break;
            case ReportType.RADIAL_BAR:
                this.chart = new RadialBar(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                    maxAngle: 270,
                });
                break;
            case ReportType.SANKEY:
                this.chart = new Sankey(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    sourceField: this.reportDSL.cube[CubeKey.sourceField] as string || 'source',
                    targetField: this.reportDSL.cube[CubeKey.targetField] as string || 'target',
                    weightField: this.reportDSL.cube[CubeKey.weightField] as string || 'value',
                });
                break;
            case ReportType.CHORD:
                this.chart = new Chord(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    sourceField: this.reportDSL.cube[CubeKey.sourceField] as string || 'source',
                    targetField: this.reportDSL.cube[CubeKey.targetField] as string || 'target',
                    weightField: this.reportDSL.cube[CubeKey.weightField] as string || 'value',
                });
                break;
            case ReportType.BUBBLE:
                this.chart = new Scatter(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                    sizeField: this.reportDSL.cube['sizeField'] as string || this.reportDSL.cube[CubeKey.yField] as string,
                    size: [4, 30],
                    shape: 'circle',
                    pointStyle: {
                        fillOpacity: 0.8,
                        stroke: '#bbb',
                    },
                });
                break;
        }
        this.chart.render();
    }

    onConfigChange() {
        if (this.reportDSL.type !== ReportType.TABLE) {
            if (Array.isArray(this.reportDSL.cube[CubeKey.xField])) {
                this.reportDSL.cube[CubeKey.xField] = this.reportDSL.cube[CubeKey.xField][0];
            }
            if (Array.isArray(this.reportDSL.cube[CubeKey.yField])) {
                this.reportDSL.cube[CubeKey.yField] = this.reportDSL.cube[CubeKey.yField][0];
            }
        } else {
            if (this.reportDSL.cube[CubeKey.xField] && !Array.isArray(this.reportDSL.cube[CubeKey.xField])) {
                this.reportDSL.cube[CubeKey.xField] = [this.reportDSL.cube[CubeKey.xField] as string];
            }
            if (this.reportDSL.cube[CubeKey.yField] && !Array.isArray(this.reportDSL.cube[CubeKey.yField])) {
                this.reportDSL.cube[CubeKey.yField] = [this.reportDSL.cube[CubeKey.yField] as string];
            }
        }
        this.renderChart();
    }

    protected readonly CubeKey = CubeKey;
    protected readonly ReportType = ReportType;
}
