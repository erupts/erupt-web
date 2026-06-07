import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import {
    CubeKey,
    Dashboard,
    DashboardDSL,
    DashboardTheme,
    FilterDSL,
    ReportDSL,
    ReportType,
    SubModelDSL
} from "../../model/dashboard.model";
import {CubeApiService} from "../../service/cube-api.service";
import {PivotSheet} from '@antv/s2';
import {CubeFilter, CubeOperator, DimensionFormat} from "../../model/cube-query.model";
import {WindowModel} from "@shared/model/window.model";
import {
    Area,
    Bar,
    Chord,
    Column,
    Funnel,
    Gauge,
    Heatmap,
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
    Treemap,
    Waterfall,
    WordCloud
} from "@antv/g2plot";
import {BaseField, CubeMeta, FieldType} from "../../model/cube.model";
import {STColumn, STComponent} from "@delon/abc/st";
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {CubeDrillDetailComponent} from "../cube-drill-detail/cube-drill-detail.component";
import {forkJoin} from "rxjs";
import {finalize} from "rxjs/operators";

@Component({
    selector: 'cube-puzzle-report',
    standalone: false,
    templateUrl: './cube-puzzle-report.html',
    styleUrl: './cube-puzzle-report.less'
})
export class CubePuzzleReport implements OnInit, OnDestroy {

    @Input() report: ReportDSL;

    @Input() dashboard: Dashboard;
    @Input() dsl: DashboardDSL;
    @Input() filters: FilterDSL[] = [];

    @Input() cubeMeta: CubeMeta;

    /** Triggered when a chart element (e.g., the bar/point corresponding to the X axis) is clicked to activate linkage filtering */
    @Output() filterLink = new EventEmitter<{ field: string; value: any }>();

    @ViewChild('chartContainer', {static: false}) chartContainer: ElementRef;

    @ViewChild('st', {static: false}) st: STComponent;

    @ViewChild('tableContainer', {static: false}) tableContainer: ElementRef;

    @ViewChild('pivotContainer', {static: false}) pivotContainer: ElementRef;

    querying: boolean = false;

    requiredUnfilled: boolean = false;

    chartData: Record<string, any>[] = [];

    chart: any;

    kpiCompareValue: number | null = null;

    private _compareSeriesOverride: string | null = null;

    private observer: IntersectionObserver;

    private resizeObserver: ResizeObserver;

    private visible: boolean = false;

    private s2: PivotSheet;

    // ST component configuration
    stColumns: STColumn[] = [];

    virtualScroll: boolean = false;

    scrollConfig: any = {x: '100%'};

    enableDrill: boolean = true; // whether drill-down is enabled

    // table filtering
    activeFilters: Map<string, any> = new Map(); // currently active filter conditions

    private subMetaCache: { [key: string]: CubeMeta } = {};

    private getSubModelDSL(): SubModelDSL | null {
        if (!this.report?.subModel || !this.dsl?.subModels) return null;
        return this.dsl.subModels.find(m => m.id === this.report.subModel) || null;
    }

    private getCachedSubMeta(subModelDSL: SubModelDSL): CubeMeta | null {
        return this.subMetaCache[`${subModelDSL.cube}/${subModelDSL.explore}`] || null;
    }

    private loadAndCacheSubMeta(subModelDSL: SubModelDSL, callback: (meta: CubeMeta) => void) {
        const key = `${subModelDSL.cube}/${subModelDSL.explore}`;
        this.cubeApiService.cubeMetadata(subModelDSL.cube, subModelDSL.explore).subscribe(res => {
            const meta = res.data;
            const fieldTitleMap = new Map<string, string>();
            const fieldMap = new Map<string, BaseField>();
            [...(meta.dimensions || []), ...(meta.measures || []), ...(meta.parameters || [])].forEach(it => {
                fieldTitleMap.set(it.code, it.title);
                fieldMap.set(it.code, it);
            });
            meta.fieldTitleMap = fieldTitleMap;
            meta.fieldMap = fieldMap;
            this.subMetaCache[key] = meta;
            callback(meta);
        });
    }

    /**
     * Get field title by field code
     */
    getFieldTitle(field: string): string {
        const subModelDSL = this.getSubModelDSL();
        if (subModelDSL) {
            const subMeta = this.getCachedSubMeta(subModelDSL);
            if (subMeta) return subMeta.fieldTitleMap?.get(field) || field;
        }
        return this.cubeMeta?.fieldTitleMap?.get(field) || field;
    }

    /**
     * Get field title by field code and return G2Plot meta configuration
     */
    private getFieldMeta(fields: string | string[]): Record<string, any> {
        const meta = {};
        const fieldArray = Array.isArray(fields) ? fields : [fields];
        fieldArray.forEach(f => {
            if (f) {
                meta[f] = {
                    alias: this.getFieldTitle(f)
                };
            }
        });
        return meta;
    }

    constructor(private cubeApiService: CubeApiService,
                public el: ElementRef,
                private drawerService: NzDrawerService) {

    }

    @HostListener('window:resize')
    onResize() {
        if (this.report.type === ReportType.TABLE) {
            this.updateTableHeight();
        } else if (this.report.type === ReportType.PIVOT_TABLE) {
            if (this.s2) {
                this.s2.changeSheetSize(this.pivotContainer.nativeElement.clientWidth, this.pivotContainer.nativeElement.clientHeight);
                this.s2.render(false);
            }
        } else if (this.chart) {
            this.chart.forceFit();
        }
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

        this.resizeObserver = new ResizeObserver(() => {
            if (this.visible) {
                this.onResize()
            }
        });
        this.resizeObserver.observe(this.el.nativeElement);
    }

    /**
     * Update table height
     */
    private updateTableHeight(): void {
        if (this.tableContainer && this.tableContainer.nativeElement) {
            const containerHeight = this.tableContainer.nativeElement.clientHeight;
            if (containerHeight > 0) {
                this.scrollConfig = {
                    x: '100%',
                    y: `${containerHeight - 40}px`
                };
                if (this.st) {
                    this.st.cd();
                }
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
        // required filter validation: if any required fields are unfilled, do not send the query
        if (this.filters) {
            for (const f of this.filters) {
                if (f.notNull && !f.hidden) {
                    const v = f.value;
                    const empty = v === null || v === undefined || v === ''
                        || (Array.isArray(v) && v.every(i => i === null || i === undefined));
                    if (empty) {
                        this.requiredUnfilled = true;
                        this.chartData = [];
                        this.querying = false;
                        return;
                    }
                }
            }
        }
        this.requiredUnfilled = false;

        if (this.report.type === ReportType.TEXT) {
            this.querying = false;
            return;
        }

        // Sub-model: ensure meta is loaded before querying
        const subModelDSL = this.getSubModelDSL();
        if (subModelDSL && !this.getCachedSubMeta(subModelDSL)) {
            this.loadAndCacheSubMeta(subModelDSL, () => this.refresh());
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
        } else if (this.report.type === ReportType.HEATMAP) {
            if (this.report.cube[CubeKey.xField]) dimensions = [this.report.cube[CubeKey.xField] as string];
            if (this.report.cube[CubeKey.yField]) dimensions.push(this.report.cube[CubeKey.yField] as string);
            if (this.report.cube[CubeKey.colorField]) measures = [this.report.cube[CubeKey.colorField] as string];
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

        // TABLE can be configured with dimensions only; other component types require at least one measure before sending a request
        const noFields = measures.length === 0 && dimensions.length === 0;
        if (noFields || (measures.length === 0 && this.report.type !== ReportType.TABLE)) {
            this.chartData = [];
            this.querying = false;
            this.render();
            return;
        }

        const activeMeta = subModelDSL ? this.getCachedSubMeta(subModelDSL) : this.cubeMeta;
        const queryCube = subModelDSL ? subModelDSL.cube : this.dashboard.cuber;
        const queryExplore = subModelDSL ? subModelDSL.explore : this.dashboard.explore;

        let parameters: Record<string, any> = {};
        let cf: CubeFilter[] = [];

        if (subModelDSL) {
            // sub-model: convert dashboard filter values to sub-model field filters via fieldMappings
            for (const mapping of subModelDSL.fieldMappings || []) {
                const filter = this.filters?.find(f => f.field === mapping.dashboardField);
                if (filter?.value != null && filter.value !== '') {
                    const isParam = activeMeta?.parameters?.some(p => p.code === mapping.subField);
                    if (isParam) {
                        parameters[mapping.subField] = filter.value;
                    } else {
                        cf.push({field: mapping.subField, operator: filter.operator, value: filter.value});
                    }
                }
            }
        } else {
            // main model: merge external filters and dimension filters from user clicks
            if (this.filters) {
                for (let f of this.filters) {
                    if (f.value === null && !f.hidden && (f.operator === CubeOperator.EQ || f.operator === CubeOperator.NEQ)) {
                        cf.push({field: f.field, operator: f.operator === CubeOperator.EQ ? CubeOperator.NULL : CubeOperator.NOT_NULL, value: null});
                    } else if (f.value != null && f.value != "") {
                        if (this.cubeMeta.parameters.filter(it => it.code === f.field).length > 0) {
                            parameters[f.field] = f.value;
                        } else {
                            cf.push({field: f.field, operator: f.operator, value: f.value});
                        }
                    }
                }
            }
            for (let [field, value] of this.activeFilters) {
                cf.push({field, operator: CubeOperator.EQ, value});
            }
        }

        let sorts = [];
        if (this.report.sorts) {
            for (let sort of this.report.sorts) {
                if (sort.field) {
                    sorts.push(sort)
                }
            }
        }

        let formats: Record<string, DimensionFormat> = {};
        for (let dim of activeMeta?.dimensions || []) {
            dimensions.forEach(field => {
                if (field == dim.code && dim.type == FieldType.DATE) {
                    formats[field] = DimensionFormat.DAY;
                }
            });
        }

        const reportFilterGroup = this.report.filterGroups?.length > 0
            ? this.report.filterGroups
            : undefined;

        const baseQuery = {
            cube: queryCube,
            explore: queryExplore,
            dimensions: dimensions,
            measures: measures,
            sorts: sorts,
            filters: cf,
            filterGroups: reportFilterGroup,
            parameter: parameters,
            dimensionFormat: formats,
            limit: 5000
        };

        // Year-over-year / month-over-month: only applies to the main model when configured
        const compare = this.report.compare;
        const COMPARE_SUPPORTED = [
            ReportType.LINE, ReportType.AREA, ReportType.COLUMN, ReportType.BAR,
            ReportType.SCATTER, ReportType.RADAR, ReportType.WATERFALL, ReportType.ROSE, ReportType.RADIAL_BAR
        ];
        if (!subModelDSL && compare?.enabled && compare?.filterField && COMPARE_SUPPORTED.includes(this.report.type)) {
            const dateFilter = cf.find(f => f.field === compare.filterField);
            if (dateFilter?.operator === CubeOperator.BETWEEN && Array.isArray(dateFilter.value)
                && dateFilter.value[0] && dateFilter.value[1]) {
                const shift = compare.type === 'YOY' ? -12 : -1;
                const prevStart = this.shiftDateByMonths(dateFilter.value[0], shift);
                const prevEnd = this.shiftDateByMonths(dateFilter.value[1], shift);
                const prevFilters = cf.map(f => f === dateFilter ? {...f, value: [prevStart, prevEnd]} : f);
                const currentLabel = compare.currentLabel || 'Current period';
                const compareLabel = compare.compareLabel || (compare.type === 'YOY' ? 'Same period last year' : 'Same period last month');
                this._compareSeriesOverride = '_period';
                forkJoin([
                    this.cubeApiService.query(baseQuery),
                    this.cubeApiService.query({...baseQuery, filters: prevFilters})
                ]).pipe(finalize(() => { this.querying = false; })).subscribe({
                    next: ([curr, prev]) => {
                        this.chartData = [
                            ...curr.data.map(row => ({...row, _period: currentLabel})),
                            ...prev.data.map(row => ({...row, _period: compareLabel}))
                        ];
                        this.render();
                    },
                    error: () => {}
                });
                return;
            }
        }
        this._compareSeriesOverride = null;

        // KPI period-over-period / year-over-year: no seriesField needed, store the comparison period value directly
        if (!subModelDSL && compare?.enabled && compare?.filterField && this.report.type === ReportType.KPI) {
            const dateFilter = cf.find(f => f.field === compare.filterField);
            if (dateFilter?.operator === CubeOperator.BETWEEN && Array.isArray(dateFilter.value)
                && dateFilter.value[0] && dateFilter.value[1]) {
                const shift = compare.type === 'YOY' ? -12 : -1;
                const prevStart = this.shiftDateByMonths(dateFilter.value[0], shift);
                const prevEnd = this.shiftDateByMonths(dateFilter.value[1], shift);
                const prevFilters = cf.map(f => f === dateFilter ? {...f, value: [prevStart, prevEnd]} : f);
                forkJoin([
                    this.cubeApiService.query(baseQuery),
                    this.cubeApiService.query({...baseQuery, filters: prevFilters})
                ]).pipe(finalize(() => { this.querying = false; })).subscribe({
                    next: ([curr, prev]) => {
                        this.chartData = curr.data;
                        const yField = this.report.cube[CubeKey.yField] as string;
                        this.kpiCompareValue = prev.data[0] != null ? Number(prev.data[0][yField] ?? null) : null;
                        this.render();
                    },
                    error: () => {}
                });
                return;
            }
        }
        this.kpiCompareValue = null;

        this.cubeApiService.query(baseQuery).subscribe({
            next: (response) => {
                this.chartData = response.data;
                if (this.report.type == ReportType.TABLE) {
                    this.buildStColumns();
                    // enable virtual scrolling when data exceeds 200 rows
                    this.virtualScroll = this.chartData.length > 200;
                    // delay table height update to ensure the DOM has rendered
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
        if (this.s2) {
            this.s2.destroy();
            this.s2 = null;
        }
        if (this.report.type == ReportType.TABLE || this.report.type == ReportType.KPI || this.report.type == ReportType.TEXT) {
            return;
        } else if (this.report.type == ReportType.PIVOT_TABLE) {
            const dataConfig = {
                fields: {
                    rows: this.report.cube[CubeKey.rowsField] as string[],
                    columns: this.report.cube[CubeKey.columnsField] as string[],
                    values: this.report.cube[CubeKey.valuesField] as string[],
                },
                meta: [
                    ...Object.entries(this.getFieldMeta(this.report.cube[CubeKey.rowsField])).map(([key, value]) => ({
                        field: key,
                        name: value.alias
                    })),
                    ...Object.entries(this.getFieldMeta(this.report.cube[CubeKey.columnsField])).map(([key, value]) => ({
                        field: key,
                        name: value.alias
                    })),
                    ...Object.entries(this.getFieldMeta(this.report.cube[CubeKey.valuesField])).map(([key, value]) => ({
                        field: key,
                        name: value.alias
                    })),
                ],
                data: this.chartData,
            };
            const ele = this.pivotContainer.nativeElement;
            this.s2 = new PivotSheet(ele, dataConfig, {
                width: this.pivotContainer.nativeElement.clientWidth,
                height: this.pivotContainer.nativeElement.clientHeight
            });
            this.s2.setThemeCfg({name: this.dsl?.settings?.theme === DashboardTheme.DARK ? 'dark' : (this.report.ui['pivotTheme'] || 'gray')});
            this.s2.render();
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
            autoFit: true,
            margin: 12,
            theme: this.dsl?.settings?.theme || DashboardTheme.LIGHT,
            meta: {
                ...this.getFieldMeta(this.report.cube[CubeKey.xField]),
                ...this.getFieldMeta(this.report.cube[CubeKey.yField]),
                ...this.getFieldMeta(this.report.cube[CubeKey.seriesField]),
                ...this.getFieldMeta(this.report.cube[CubeKey.colorField]),
            }
        };
        if (this._compareSeriesOverride) {
            commonConfig.seriesField = this._compareSeriesOverride;
        }
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
                    seriesField: commonConfig.seriesField,
                    stepType: reportDSL.ui["stepType"] ? 'hv' : undefined,
                });
                break;
            case ReportType.AREA:
                chart = new Area(chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                    seriesField: commonConfig.seriesField,
                });
                break;
            case ReportType.COLUMN:
                chart = new Column(chartContainer.nativeElement, {
                    ...commonConfig,
                    isGroup: !commonConfig['isStack'],
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                    seriesField: commonConfig.seriesField,
                });
                break;
            case ReportType.BAR:
                chart = new Bar(chartContainer.nativeElement, {
                    ...commonConfig,
                    isGroup: !commonConfig['isStack'],
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                    seriesField: commonConfig.seriesField,
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
                    colorField: commonConfig.seriesField,
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
                    seriesField: commonConfig.seriesField,
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
                    seriesField: commonConfig.seriesField,
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
            case ReportType.TREEMAP: {
                const xF = reportDSL.cube[CubeKey.xField] as string;
                const yF = reportDSL.cube[CubeKey.yField] as string;
                chart = new Treemap(chartContainer.nativeElement, {
                    ...commonConfig,
                    data: {
                        name: 'root',
                        children: data.map(row => ({
                            name: String(row[xF] ?? ''),
                            value: Number(row[yF] ?? 0),
                        }))
                    },
                    colorField: 'name',
                    label: {fields: ['name']},
                });
                break;
            }
            case ReportType.HEATMAP:
                chart = new Heatmap(chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: reportDSL.cube[CubeKey.xField] as string,
                    yField: reportDSL.cube[CubeKey.yField] as string,
                    colorField: reportDSL.cube[CubeKey.colorField] as string,
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
     * Bind click linkage for G2 Plot charts that have a dimension (e.g. xField):
     * triggers filter linkage when a chart element or its corresponding X-axis data is clicked
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
        // also trigger linkage when an X-axis label is clicked (axis labels are components in G2)
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

    /** The dimension field used for linkage filtering in the current report (X axis or category axis); returns null if none */
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
     * Build ST component column configuration
     */
    buildStColumns(): void {
        this.stColumns = [];
        const xFields = this.report.cube[CubeKey.xField] || [];
        const yFields = this.report.cube[CubeKey.yField] || [];

        const xFieldsArray = Array.isArray(xFields) ? xFields : [xFields];
        const yFieldsArray = Array.isArray(yFields) ? yFields : [yFields];

        // add dimension columns (X-axis fields) - supports click filtering
        xFieldsArray.forEach(field => {
            if (field) {
                this.stColumns.push({
                    title: this.getFieldTitle(field),
                    index: [field],
                    width: 150,
                    type: 'link',
                    className: 'dimension-column',
                    click: (record: any) => {
                        this.toggleDimensionFilter(field, record[field]);
                    },
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

        // add measure columns (Y-axis fields) - supports drill-down
        yFieldsArray.forEach(field => {
            if (field) {
                const column: STColumn = {
                    title: this.getFieldTitle(field),
                    index: [field],
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
                        return val;
                    },
                };
                if (this.enableDrill && xFieldsArray.length > 0) {
                    column.type = "link";
                    column.click = (record: any) => {
                        this.openDrillDrawer(field, record);
                    };
                    column.className = 'drillable-column';
                }
                this.stColumns.push(column);
            }
        });
    }

    /**
     * Toggle dimension filter
     */
    toggleDimensionFilter(field: string, value: any): void {
        if (this.activeFilters.has(field) && this.activeFilters.get(field) === value) {
            // if the value is already filtered, remove the filter
            this.activeFilters.delete(field);
        } else {
            // otherwise add the filter
            this.activeFilters.set(field, value);
        }

        // re-request data from backend
        this.refresh();
    }

    /**
     * Clear all filters
     */
    clearAllFilters(): void {
        this.activeFilters.clear();
        // re-request data from backend
        this.refresh();
    }

    /**
     * Clear a single filter
     */
    clearFilter(field: string): void {
        this.activeFilters.delete(field);
        // re-request data from backend
        this.refresh();
    }

    /**
     * Get active filters as an array (for display)
     */
    getActiveFiltersArray(): Array<{ field: string, value: any }> {
        return Array.from(this.activeFilters.entries()).map(([field, value]) => ({
            field,
            value
        }));
    }

    /**
     * Open drill-down drawer
     */
    openDrillDrawer(measure: string, record: any): void {
        const subModelDSL = this.getSubModelDSL();
        const activeMeta = subModelDSL ? this.getCachedSubMeta(subModelDSL) : this.cubeMeta;
        const drillFilters: CubeFilter[] = [];

        // carry all dimension values from the current row as filter conditions (field codes already belong to the active model)
        const xFields = this.report.cube[CubeKey.xField] || [];
        const xFieldsArray = Array.isArray(xFields) ? xFields : [xFields];
        for (const f of xFieldsArray) {
            if (f && record[f] !== undefined && record[f] !== null) {
                drillFilters.push({field: f, operator: CubeOperator.EQ, value: record[f]});
            }
        }

        if (subModelDSL) {
            // sub-model: convert dashboard filter values to sub-model fields via fieldMappings
            for (const mapping of subModelDSL.fieldMappings || []) {
                const filter = this.filters?.find(f => f.field === mapping.dashboardField);
                if (filter?.value != null && filter.value !== '') {
                    const isParam = activeMeta?.parameters?.some(p => p.code === mapping.subField);
                    if (!isParam) {
                        drillFilters.push({field: mapping.subField, operator: filter.operator, value: filter.value});
                    }
                }
            }
        } else {
            // main model: external filters and active dimension filters
            if (this.filters) {
                for (const f of this.filters) {
                    if (f.value != null && this.cubeMeta.parameters.filter(it => it.code === f.field).length === 0) {
                        drillFilters.push({field: f.field, operator: f.operator, value: f.value});
                    }
                }
            }
            for (const [f, v] of this.activeFilters) {
                drillFilters.push({field: f, operator: CubeOperator.EQ, value: v});
            }
        }

        this.drawerService.create({
            nzTitle: 'Drill-down Analysis - ' + (activeMeta?.fieldTitleMap?.get(measure) || measure) + ': ' + record[measure],
            nzContent: CubeDrillDetailComponent,
            nzContentParams: {
                measure: measure,
                dashboard: this.dashboard,
                cubeMeta: activeMeta || this.cubeMeta,
                filters: drillFilters,
                cube: subModelDSL?.cube,
                explore: subModelDSL?.explore,
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
        if (this.s2) {
            this.s2.destroy();
            this.s2 = null;
        }
    }

    getKpiDelta(): number {
        if (!this.chartData?.length || this.kpiCompareValue === null) return 0;
        const curr = Number(this.chartData[0][this.report.cube[CubeKey.yField] as string] ?? 0);
        return curr - this.kpiCompareValue;
    }

    getKpiPct(): number {
        if (this.kpiCompareValue === null || this.kpiCompareValue === 0) return 0;
        const curr = Number(this.chartData[0][this.report.cube[CubeKey.yField] as string] ?? 0);
        return (curr - this.kpiCompareValue) / Math.abs(this.kpiCompareValue) * 100;
    }

    private shiftDateByMonths(date: any, months: number): Date {
        const d = date instanceof Date ? new Date(date) : new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    }

    protected readonly DashboardTheme = DashboardTheme;

    protected readonly ReportType = ReportType;

    protected readonly CubeKey = CubeKey;

}
