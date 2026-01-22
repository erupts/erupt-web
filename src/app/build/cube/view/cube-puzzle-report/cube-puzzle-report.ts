import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CubeKey, Dashboard, ReportDSL, ReportType} from "../../model/dashboard.model";
import {CubeApiService} from "../../service/cube-api.service";
import {PivotSheet} from '@antv/s2';
import {CubeFilter} from "../../model/cube-query.model";
import {WindowModel} from "@shared/model/window.model";
import {
    Area,
    Bar,
    Chord,
    Column,
    Funnel,
    Gauge,
    Line,
    Pie,
    Progress,
    Radar,
    RadialBar,
    RingProgress,
    Rose,
    Sankey, SankeyOptions,
    Scatter,
    TinyArea,
    TinyColumn,
    TinyLine,
    Waterfall,
    WordCloud
} from "@antv/g2plot";

@Component({
    selector: 'cube-puzzle-report',
    standalone: false,
    templateUrl: './cube-puzzle-report.html',
    styleUrl: './cube-puzzle-report.less'
})
export class CubePuzzleReport implements OnInit, OnDestroy {

    @Input() report: ReportDSL;

    @Input() dashboard: Dashboard;

    @Input() filters: CubeFilter[] = [];

    @ViewChild('chartContainer', {static: false}) chartContainer: ElementRef;

    querying: boolean = false;

    chartData: Record<string, any>[] = [];

    chart: any;

    private observer: IntersectionObserver;

    private visible: boolean = false;

    constructor(private cubeApiService: CubeApiService, private el: ElementRef) {

    }

    ngOnInit(): void {
        this.querying = true;
        this.observer = new IntersectionObserver((entries) => {
            if (entries.some(entry => entry.isIntersecting || entry.intersectionRatio > 0)) {
                if (!this.visible) {
                    this.visible = true;
                    this.refresh();
                    if (this.observer) {
                        this.observer.disconnect();
                    }
                }
            }
        }, {
            rootMargin: '100px',
        });
        this.observer.observe(this.el.nativeElement);
    }

    download() {
        if (this.report.type == ReportType.TABLE) {
            let csv = [];
            let header = [];
            if (this.report.cube[CubeKey.xField]) {
                header.push(...(Array.isArray(this.report.cube[CubeKey.xField]) ? this.report.cube[CubeKey.xField] : [this.report.cube[CubeKey.xField]]));
            }
            if (this.report.cube[CubeKey.yField]) {
                header.push(...(Array.isArray(this.report.cube[CubeKey.yField]) ? this.report.cube[CubeKey.yField] : [this.report.cube[CubeKey.yField]]));
            }
            csv.push(header.map(it => '"' + it.replace(/"/g, '""') + '"').join(','));
            for (let row of this.chartData) {
                let values = [];
                for (let col of header) {
                    let val = row[col];
                    if (val === null || val === undefined) {
                        val = '';
                    } else if (typeof val === 'string') {
                        val = '"' + val.replace(/"/g, '""') + '"';
                    }
                    values.push(val);
                }
                csv.push(values.join(','));
            }
            let csvContent = csv.join('\n');
            let blob = new Blob(['\ufeff' + csvContent], {type: 'text/csv;charset=utf-8;'});
            let url = URL.createObjectURL(blob);
            let anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = this.report.title + '.csv';
            anchor.click();
            URL.revokeObjectURL(url);
        } else {
            if (this.chart) {
                let canvas = this.chartContainer.nativeElement.querySelector("canvas");
                let src = canvas.toDataURL("image/png");
                let anchor = document.createElement('a');
                if ('download' in anchor) {
                    anchor.style.visibility = 'hidden';
                    anchor.href = src;
                    anchor.download = this.report.title;
                    document.body.appendChild(anchor);
                    let evt = document.createEvent('MouseEvents');
                    evt.initEvent('click', true, true);
                    anchor.dispatchEvent(evt);
                    document.body.removeChild(anchor);
                } else {
                    window.open(src);
                }
            }
        }
    }

    refresh(): void {
        if (!this.visible) {
            return;
        }
        this.querying = true;
        let dimensions = [];
        let measures = [];

        if (this.report.type === ReportType.PIVOT_TABLE) {
            if (this.report.cube[CubeKey.rowsField]) {
                dimensions = [...this.report.cube[CubeKey.rowsField] as string[]];
            }
            if (this.report.cube[CubeKey.columnsField]) {
                if (this.report.cube[CubeKey.columnsField]) {
                    dimensions.push(...this.report.cube[CubeKey.columnsField] as string[]);
                }
            }
            if (this.report.cube[CubeKey.valuesField]) {
                measures = this.report.cube[CubeKey.valuesField] as string[];
            }
        } else {
            // For other chart types
            if (this.report.cube[CubeKey.xField]) {
                if (Array.isArray(this.report.cube[CubeKey.xField])) {
                    dimensions = this.report.cube[CubeKey.xField];
                } else {
                    dimensions = [this.report.cube[CubeKey.xField]];
                }
            }
            if (this.report.cube[CubeKey.yField]) {
                if (Array.isArray(this.report.cube[CubeKey.yField])) {
                    measures = this.report.cube[CubeKey.yField];
                } else {
                    measures = [this.report.cube[CubeKey.yField]];
                }
            }
            if (this.report.cube[CubeKey.seriesField]) {
                if (Array.isArray(this.report.cube[CubeKey.seriesField])) {
                    dimensions.push(...this.report.cube[CubeKey.seriesField]);
                } else {
                    dimensions.push(this.report.cube[CubeKey.seriesField]);
                }
            }

        }
        let cf: CubeFilter[] = [];
        if (this.filters) {
            for (let f of this.filters) {
                if (f.value) {
                    cf.push(f);
                }
            }
        }
        this.cubeApiService.query({
            cube: this.dashboard.cuber,
            explore: this.dashboard.explore,
            dimensions: dimensions,
            measures: measures,
            sorts: this.report.cube[CubeKey.sortField] ? [{
                field: this.report.cube[CubeKey.sortField] as string,
                direction: this.report.cube[CubeKey.sortDirection] as any || 'ASC'
            }] : [],
            filters: cf
        }).subscribe({
            next: (response) => {
                this.chartData = response.data;
                this.render();
            },
            complete: () => {
                this.querying = false;
            }
        })
    }

    render() {
        if (!this.visible) {
            return;
        }
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        if (this.report.type == ReportType.TABLE || this.report.type == ReportType.KPI) {
            return;
        } else if (this.report.type == ReportType.PIVOT_TABLE) {
            const dataConfig = {
                fields: {
                    rows: this.report.cube[CubeKey.rowsField] as string[],
                    columns: this.report.cube[CubeKey.columnsField] as string[],
                    values: this.report.cube[CubeKey.valuesField] as string[],
                },
                data: this.chartData,
            };
            const ele = this.chartContainer.nativeElement;
            const s2 = new PivotSheet(ele, dataConfig, {
                width: this.chartContainer.nativeElement.clientWidth,
                height: this.chartContainer.nativeElement.clientHeight
            });
            s2.setThemeCfg({name: 'gray'});
            s2.render();
        } else {
            this.chart = this.renderChart(this.chartData)
        }
    }

    renderChart(data: Record<string, any>[]): any {
        let reportDSL = this.report;
        let chartContainer = this.chartContainer;
        const commonConfig: any = {
            data: data,
            ...this.report.cube,
            ...this.report.ui,
        };
        if (WindowModel.theme.primaryColor) {
            // commonConfig.color = WindowModel.theme.primaryColor
        }
        if (reportDSL.ui["legendPosition"]) {
            commonConfig["legend"] = {
                layout: 'horizontal',
                position: reportDSL.ui["legendPosition"],
            };
        }
        if (reportDSL.ui["showLabel"]) {
            commonConfig["label"] = {
                position: reportDSL.type === ReportType.PIE ? 'outer' : 'middle',
            };
        }
        if (reportDSL.ui["showSlider"]) {
            commonConfig["slider"] = {};
        }
        if (reportDSL.ui["showScrollbar"]) {
            commonConfig["scrollbar"] = {};
        }
        if (reportDSL.ui["hideXAxis"] == true) {
            commonConfig["xAxis"] = false;
        }
        if (reportDSL.ui["hideYAxis"] == true) {
            commonConfig["yAxis"] = false;
        }
        if (reportDSL.ui["hideTooltip"] == true) {
            commonConfig["tooltip"] = false;
        }
        if (reportDSL.ui["color"] && reportDSL.ui["color"].length > 0) {
            commonConfig["color"] = reportDSL.ui["color"];
        }
        let chart: any = null;
        switch (reportDSL.type) {
            case ReportType.LINE:
                chart = new Line(chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                    seriesField: reportDSL.cube[CubeKey.seriesField] as string,
                    stepType: reportDSL.ui["stepType"] ? 'hv' : undefined,
                });
                break;
            case ReportType.AREA:
                chart = new Area(chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                    seriesField: reportDSL.cube[CubeKey.seriesField] as string,
                });
                break;
            case ReportType.COLUMN:
                chart = new Column(chartContainer.nativeElement, {
                    ...commonConfig,
                    isGroup: !commonConfig['isStack'],
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                    seriesField: reportDSL.cube[CubeKey.seriesField] as string,
                });
                break;
            case ReportType.BAR:
                chart = new Bar(chartContainer.nativeElement, {
                    ...commonConfig,
                    isGroup: !commonConfig['isStack'],
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                    seriesField: reportDSL.cube[CubeKey.seriesField] as string,
                });
                break;
            case ReportType.PIE:
                chart = new Pie(chartContainer.nativeElement, {
                    ...commonConfig,
                    angleField: reportDSL.cube[CubeKey.yField] as string,
                    colorField: reportDSL.cube[CubeKey.xField] as string,
                    radius: reportDSL.ui["innerRadius"] ? 1 : 0.8,
                    innerRadius: reportDSL.ui["innerRadius"] || 0,
                    label: reportDSL.ui["showLabel"] ? {type: 'outer'} : false
                });
                break;
            case ReportType.SCATTER:
                chart = new Scatter(chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                    colorField: reportDSL.cube[CubeKey.seriesField] as string,
                });
                break;
            case ReportType.BUBBLE:
                chart = new Scatter(chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                    sizeField: reportDSL.cube[CubeKey.sizeField] as string || reportDSL.cube[CubeKey.yField] as string,
                    size: [4, 30],
                    shape: 'circle',
                    pointStyle: {
                        fillOpacity: 0.8,
                        stroke: '#bbb',
                    },
                });
                break;
            case ReportType.RADAR:
                chart = new Radar(chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                    seriesField: reportDSL.cube[CubeKey.seriesField] as string,
                });
                break;
            case ReportType.FUNNEL:
                chart = new Funnel(chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                });
                break;
            case ReportType.GAUGE:
                chart = new Gauge(chartContainer.nativeElement, {
                    ...commonConfig,
                    percent: (data && data.length > 0) ? (data[0][reportDSL.cube[CubeKey.yField] as string] || data[0][CubeKey.yField] || 0) / 100 : 0,
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
                chart = new Waterfall(chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                });
                break;
            case ReportType.WORD_CLOUD:
                chart = new WordCloud(chartContainer.nativeElement, {
                    ...commonConfig,
                    wordField: reportDSL.cube[CubeKey.xField] as string,
                    weightField: reportDSL.cube[CubeKey.yField] as string,
                    colorField: reportDSL.cube[CubeKey.xField] as string,
                    wordStyle: {
                        fontFamily: 'Verdana',
                        fontSize: [24, 80],
                    },
                });
                break;
            case ReportType.ROSE:
                chart = new Rose(chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                    seriesField: reportDSL.cube[CubeKey.seriesField] as string,
                    radius: 0.9,
                });
                break;
            case ReportType.RADIAL_BAR:
                chart = new RadialBar(chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                    maxAngle: 270,
                });
                break;
            case ReportType.SANKEY:
                chart = new Sankey(chartContainer.nativeElement, {
                    ...commonConfig,
                    sourceField: reportDSL.cube[CubeKey.sourceField] as string || 'source',
                    targetField: reportDSL.cube[CubeKey.targetField] as string || 'target',
                    weightField: reportDSL.cube[CubeKey.weightField] as string || 'value',
                    nodeDraggable: true,
                    nodeWidthRatio: 0.008,
                    nodePaddingRatio: 0.03
                } as SankeyOptions);
                break;
            case ReportType.CHORD:
                chart = new Chord(chartContainer.nativeElement, {
                    ...commonConfig,
                    sourceField: reportDSL.cube[CubeKey.sourceField] as string || 'source',
                    targetField: reportDSL.cube[CubeKey.targetField] as string || 'target',
                    weightField: reportDSL.cube[CubeKey.weightField] as string || 'value',
                });
                break;
            case ReportType.TINY_LINE:
                chart = new TinyLine(chartContainer.nativeElement, {
                    ...commonConfig,
                    data: data.map(item => item[reportDSL.cube[CubeKey.yField] as string]),
                });
                break;
            case ReportType.TINY_AREA:
                chart = new TinyArea(chartContainer.nativeElement, {
                    ...commonConfig,
                    data: data.map(item => item[reportDSL.cube[CubeKey.yField] as string]),
                });
                break;
            case ReportType.TINY_COLUMN:
                chart = new TinyColumn(chartContainer.nativeElement, {
                    ...commonConfig,
                    data: data.map(item => item[reportDSL.cube[CubeKey.yField] as string]),
                });
                break;
            case ReportType.PROGRESS:
                chart = new Progress(chartContainer.nativeElement, {
                    ...commonConfig,
                    percent: (data && data.length > 0) ? (data[0][reportDSL.cube[CubeKey.yField] as string] || data[0][CubeKey.yField] || 0) / 100 : 0,
                    color: reportDSL.ui["color"] || ['#5B8FF9', '#E8EDF3'],
                });
                break;
            case ReportType.RING_PROGRESS:
                chart = new RingProgress(chartContainer.nativeElement, {
                    ...commonConfig,
                    percent: (data && data.length > 0) ? (data[0][reportDSL.cube[CubeKey.yField] as string] || data[0][CubeKey.yField] || 0) / 100 : 0,
                    color: reportDSL.ui["color"] || ['#5B8FF9', '#E8EDF3'],
                    innerRadius: reportDSL.ui["innerRadius"] || 0.8,
                    radius: 0.98,
                });
                break;
        }
        chart.render();
        return chart;
    }


    ngOnDestroy(): void {
        if (this.observer) {
            this.observer.disconnect();
        }
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    protected readonly ReportType = ReportType;

    protected readonly CubeKey = CubeKey;

}
