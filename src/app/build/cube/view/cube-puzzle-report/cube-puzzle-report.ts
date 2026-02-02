import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
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
    Sankey,
    SankeyOptions,
    Scatter,
    TinyArea,
    TinyColumn,
    TinyLine,
    Waterfall,
    WordCloud
} from "@antv/g2plot";
import {CubeMeta} from "../../model/cube.model";
import {STColumn, STComponent} from "@delon/abc/st";
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {CubeDrillDetailComponent, DrillDetailParams} from "../cube-drill-detail/cube-drill-detail.component";

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

    @Input() cubeMeta: CubeMeta;

    /** 点击图表元素（如 X 轴对应柱子/点）时触发联动筛选 */
    @Output() filterLink = new EventEmitter<{ field: string; value: any }>();

    @ViewChild('chartContainer', {static: false}) chartContainer: ElementRef;

    @ViewChild('st', {static: false}) st: STComponent;

    @ViewChild('tableContainer', {static: false}) tableContainer: ElementRef;

    querying: boolean = false;

    chartData: Record<string, any>[] = [];

    chart: any;

    private observer: IntersectionObserver;

    private resizeObserver: ResizeObserver;

    private visible: boolean = false;

    // ST 组件配置
    stColumns: STColumn[] = [];

    virtualScroll: boolean = false;

    scrollConfig: any = {x: '100%'};

    enableDrill: boolean = true; // 是否启用下钻功能

    constructor(private cubeApiService: CubeApiService,
                private el: ElementRef,
                private drawerService: NzDrawerService) {

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


    /**
     * 更新表格高度
     */
    private updateTableHeight(): void {
        if (this.tableContainer && this.tableContainer.nativeElement) {
            const containerHeight = this.tableContainer.nativeElement.clientHeight;
            if (containerHeight > 0) {
                this.scrollConfig = {
                    x: '100%',
                    y: `${containerHeight - 39}px`
                };
            }
        }
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
        let parameters: Record<string, any> = {};
        let cf: CubeFilter[] = [];
        if (this.filters) {
            for (let f of this.filters) {
                if (f.value != null) {
                    if (this.cubeMeta.parameters.filter(it => it.code === f.field).length > 0) {
                        parameters[f.field] = f.value;
                    } else {
                        cf.push({
                            field: f.field,
                            operator: f.operator,
                            value: f.value
                        });
                    }
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
            filters: cf,
            parameters: parameters
        }).subscribe({
            next: (response) => {
                this.chartData = response.data;
                if (this.report.type == ReportType.TABLE) {
                    this.buildStColumns();
                    // 数据量大于500条时启用虚拟滚动
                    this.virtualScroll = this.chartData.length > 200;
                    // 延迟更新表格高度，确保 DOM 已渲染
                    setTimeout(() => {
                        this.updateTableHeight();
                    }, 100);
                }
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
            s2.setThemeCfg({name: this.report.ui['pivotTheme'] || 'gray'});
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
        this.bindFilterLinkIfNeeded(chart);
        return chart;
    }

    /**
     * 为带维度（如 xField）的 G2 Plot 图表绑定点击联动：点击图表元素或 X 轴对应数据时触发筛选联动
     */
    private bindFilterLinkIfNeeded(chart: any): void {
        if (!chart?.chart) {
            return;
        }
        const linkageField = this.getLinkageDimensionField();
        if (!linkageField) {
            return;
        }
        const g2Chart = chart.chart;
        const handler = (ev: any) => {
            const data = ev.data?.data ?? ev.data;
            if (!data || typeof data !== 'object') {
                return;
            }
            const value = data[linkageField];
            if (value !== undefined && value !== null) {
                this.filterLink.emit({field: linkageField, value});
            }
        };
        g2Chart.on('element:click', handler);
        // 点击 X 轴标签时也触发联动（G2 中轴标签属于 component）
        g2Chart.on('component:click', (ev: any) => {
            const target = ev.target?.get?.('type') ?? ev.target?.cfg?.name;
            if (target === 'axis-label' || (ev.target?.cfg?.component?.options?.type === 'axis')) {
                const value = ev.target?.get?.('datum') ?? ev.target?.cfg?.datum ?? ev.data?.value;
                if (value !== undefined && value !== null) {
                    this.filterLink.emit({field: linkageField, value});
                }
            }
        });
    }

    /** 当前报表用于联动筛选的维度字段（X 轴或分类轴），无则返回 null */
    private getLinkageDimensionField(): string | null {
        if (!this.report?.cube) {
            return null;
        }
        const cube = this.report.cube;
        if (this.report.type === ReportType.PIE) {
            const f = cube[CubeKey.xField];
            return Array.isArray(f) ? f[0] : (f ?? null);
        }
        const x = cube[CubeKey.xField];
        if (x) {
            return Array.isArray(x) ? x[0] : x;
        }
        return null;
    }

    /**
     * 构建 ST 组件列配置
     */
    buildStColumns(): void {
        this.stColumns = [];
        const xFields = this.report.cube[CubeKey.xField] || [];
        const yFields = this.report.cube[CubeKey.yField] || [];

        const xFieldsArray = Array.isArray(xFields) ? xFields : [xFields];
        const yFieldsArray = Array.isArray(yFields) ? yFields : [yFields];

        // 添加维度列（X轴字段）
        xFieldsArray.forEach(field => {
            if (field) {
                this.stColumns.push({
                    title: field,
                    index: field,
                    width: 150,
                    sort: {
                        compare: (a: any, b: any) => {
                            const valA = a[field];
                            const valB = b[field];
                            if (valA === null || valA === undefined) return -1;
                            if (valB === null || valB === undefined) return 1;
                            if (typeof valA === 'number' && typeof valB === 'number') {
                                return valA - valB;
                            }
                            if (typeof valA === 'string' && typeof valB === 'string') {
                                return valA.localeCompare(valB);
                            }
                            return 0;
                        }
                    },
                    filter: {
                        type: 'keyword',
                        fn: (filter: any, record: any) => {
                            if (filter.value) {
                                const val = record[field];
                                if (val !== null && val !== undefined) {
                                    return val.toString().indexOf(filter.value) !== -1;
                                }
                                return false;
                            }
                            return true;
                        }
                    }
                });
            }
        });

        // 添加指标列（Y轴字段）- 支持下钻
        yFieldsArray.forEach(field => {
            if (field) {
                const column: STColumn = {
                    title: field,
                    index: field,
                    width: 150,
                    sort: {
                        compare: (a: any, b: any) => {
                            const valA = a[field];
                            const valB = b[field];
                            if (valA === null || valA === undefined) return -1;
                            if (valB === null || valB === undefined) return 1;
                            if (typeof valA === 'number' && typeof valB === 'number') {
                                return valA - valB;
                            }
                            return 0;
                        }
                    },
                    format: (item: any) => {
                        const val = item[field];
                        if (typeof val === 'number') {
                            return val.toLocaleString();
                        }
                        return val;
                    },
                };
                if (this.enableDrill && xFieldsArray.length > 0) {
                    column.type = "link";
                    column.click = (record: any) => {
                        console.log(record)
                        this.openDrillDrawer(xFieldsArray[0], record[xFieldsArray[0]], field, record);
                    };
                    column.className = 'drillable-column';
                }
                this.stColumns.push(column);
            }
        });
    }

    /**
     * 打开下钻抽屉
     */
    openDrillDrawer(field: string, value: any, measure: string, record: any): void {
        const params: DrillDetailParams = {
            field: field,
            value: value,
            dimension: field,
            measure: measure,
            dashboard: this.dashboard,
            cubeMeta: this.cubeMeta
        };

        this.drawerService.create({
            nzTitle: `下钻分析 - ${field}: ${value}`,
            nzContent: CubeDrillDetailComponent,
            nzContentParams: {
                params: params
            },
            nzWidth: '75%',
            nzClosable: true,
            nzMaskClosable: true,
            nzKeyboard: true,
            nzBodyStyle: {
                padding: 0,
                height: '100%'
            }
        });
    }

    ngOnDestroy(): void {
        if (this.observer) {
            this.observer.disconnect();
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    protected readonly ReportType = ReportType;

    protected readonly CubeKey = CubeKey;

}
