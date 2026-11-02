import {Component, Input, OnChanges, OnInit, QueryList, SimpleChanges, ViewChildren} from '@angular/core';
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {CubeChart, kvValues, Vis} from "../../../erupt/model/erupt.model";
import {QueryCondition, QueryExpression} from "../../../erupt/model/erupt.vo";
import {CubeApiService} from "../../service/cube-api.service";
import {CubePuzzleReport} from "../cube-puzzle-report/cube-puzzle-report";
import {
    CubeKey,
    Dashboard,
    DashboardDSL,
    FilterDSL,
    ReportDSL,
    ReportType
} from "../../model/dashboard.model";
import {BaseField, CubeMeta} from "../../model/cube.model";
import {CubeOperator} from "../../model/cube-query.model";

/**
 * Charts of an @EruptCube explore rendered as one of the model's views. Every chart is a
 * cube-puzzle-report fed with a ReportDSL built from the annotation; the list's current
 * search conditions become cube filters so the charts describe the rows on screen.
 */
@Component({
    standalone: false,
    selector: 'vis-cube',
    templateUrl: './cube-vis.component.html',
    styleUrls: ['./cube-vis.component.less']
})
export class CubeVisComponent implements OnInit, OnChanges {

    @Input() eruptBuildModel: EruptBuildModel;
    @Input() vis: Vis;
    // current search of the list; a new array arrives on every query
    @Input() conditions: QueryCondition[] = [];

    @ViewChildren(CubePuzzleReport) reportRefs: QueryList<CubePuzzleReport>;

    cubeMeta: CubeMeta;
    dashboard: Dashboard;
    dsl: DashboardDSL = {settings: {}};
    reports: ReportDSL[] = [];
    filters: FilterDSL[] = [];
    // EQ filters set by clicking chart elements, shown as removable tags
    linked: FilterDSL[] = [];
    loading = false;
    unavailable = false;

    // erupt search operators → cube operators; RANGE is handled separately
    private static readonly OPERATORS: Partial<Record<QueryExpression, CubeOperator>> = {
        [QueryExpression.EQ]: CubeOperator.EQ,
        [QueryExpression.NEQ]: CubeOperator.NEQ,
        [QueryExpression.LIKE]: CubeOperator.LIKE,
        [QueryExpression.NOT_LIKE]: CubeOperator.NOT_LIKE,
        [QueryExpression.IN]: CubeOperator.IN,
        [QueryExpression.NOT_IN]: CubeOperator.NOT_IN,
        [QueryExpression.NULL]: CubeOperator.NULL,
        [QueryExpression.NOT_NULL]: CubeOperator.NOT_NULL,
        [QueryExpression.GT]: CubeOperator.GT,
        [QueryExpression.GTE]: CubeOperator.EGT,
        [QueryExpression.LT]: CubeOperator.LT,
        [QueryExpression.LTE]: CubeOperator.ELT,
    };

    constructor(private cubeApiService: CubeApiService) {
    }

    ngOnInit() {
        this.load();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['vis'] && !changes['vis'].firstChange) {
            this.load();
            return;
        }
        if (changes['conditions'] && !changes['conditions'].firstChange) {
            this.applyFilters();
        }
    }

    get cube(): string {
        return this.cubeName();
    }

    get gridColumns(): number {
        return Math.max(1, this.vis?.cubeView?.columns || 2);
    }

    span(chart: CubeChart): number {
        return Math.min(Math.max(1, chart.span || 1), this.gridColumns);
    }

    private load() {
        if (!this.vis?.cubeView) return;
        const cube = this.cube;
        const explore = this.vis.cubeView.explore;
        this.loading = true;
        this.unavailable = false;
        this.reports = [];
        this.linked = [];
        this.dashboard = {code: '', name: '', cuber: cube, explore};
        this.cubeApiService.cubeMetadata(cube, explore).subscribe({
            next: res => {
                this.loading = false;
                if (!res?.success || !res.data) {
                    this.unavailable = true;
                    return;
                }
                this.cubeMeta = CubeVisComponent.indexMeta(res.data);
                this.reports = this.vis.cubeView.charts.map(chart => this.toReport(chart));
                this.applyFilters();
            },
            error: () => {
                this.loading = false;
                this.unavailable = true;
            }
        });
    }

    // the report component looks fields up through these maps (titles, types, drill)
    private static indexMeta(meta: CubeMeta): CubeMeta {
        const fieldTitleMap = new Map<string, string>();
        const fieldMap = new Map<string, BaseField>();
        for (const it of [...(meta.dimensions || []), ...(meta.measures || []), ...(meta.parameters || [])]) {
            fieldTitleMap.set(it.code, it.title);
            fieldMap.set(it.code, it);
        }
        meta.fieldTitleMap = fieldTitleMap;
        meta.fieldMap = fieldMap;
        return meta;
    }

    // cube field codes are "Cube.field"; the annotation may name the field alone
    private qualify(field: string): string {
        return field.includes('.') ? field : this.cubeName() + '.' + field;
    }

    // the annotation names a class; core serializes it as its simple name, which is the cube code.
    // The default Void.class stands for the model itself.
    private cubeName(): string {
        const cube = this.vis?.cubeView?.cube;
        return cube && cube !== 'Void' ? cube : this.eruptBuildModel?.eruptModel?.eruptName;
    }

    private toReport(chart: CubeChart): ReportDSL {
        const x = (chart.x || []).map(f => this.qualify(f));
        const y = (chart.y || []).map(f => this.qualify(f));
        const series = chart.series ? this.qualify(chart.series) : undefined;
        const cube: ReportDSL['cube'] = {};
        switch (chart.type) {
            case ReportType.PIVOT_TABLE:
                cube[CubeKey.rowsField] = x;
                cube[CubeKey.columnsField] = series ? [series] : [];
                cube[CubeKey.valuesField] = y;
                break;
            case ReportType.HEATMAP:
                cube[CubeKey.xField] = x[0];
                cube[CubeKey.yField] = series;
                cube[CubeKey.colorField] = y[0];
                break;
            case ReportType.KPI:
                cube[CubeKey.yField] = y[0];
                break;
            default:
                cube[CubeKey.xField] = CubeVisComponent.single(x);
                cube[CubeKey.yField] = CubeVisComponent.single(y);
                if (series) cube[CubeKey.seriesField] = series;
        }
        return {
            type: chart.type as ReportType,
            title: chart.title,
            cube,
            ui: kvValues(chart.ui),
            x: 0, y: 0, cols: 1, rows: 1
        };
    }

    // a lone field is passed as a string, several as an array, as the report code accepts both
    private static single(fields: string[]): string | string[] {
        return fields.length === 1 ? fields[0] : fields;
    }

    /**
     * Rebuild the filter list handed to every chart: search conditions of the list (when
     * linked) plus the EQ filters picked by clicking chart elements; then re-query.
     */
    private applyFilters() {
        if (!this.cubeMeta) return;
        const filters: FilterDSL[] = this.vis.cubeView.linkSearch ? this.fromConditions(this.conditions || []) : [];
        for (const link of this.linked) {
            // a click on a field replaces whatever the search said about it
            const idx = filters.findIndex(f => f.field === link.field);
            if (idx >= 0) filters.splice(idx, 1);
            filters.push(link);
        }
        this.filters = filters;
        // the inputs are bound by reference, so wait for the new array to reach the children
        setTimeout(() => this.reportRefs?.forEach(r => r.refresh()));
    }

    private fromConditions(conditions: QueryCondition[]): FilterDSL[] {
        const filters: FilterDSL[] = [];
        const mapping = kvValues(this.vis.cubeView.searchMapping);
        for (const raw of conditions) {
            // a differently named dimension is reached through searchMapping, then qualified with the cube
            const c = {...raw, key: this.qualify(mapping[raw.key] || raw.key)};
            if (!this.cubeMeta.fieldMap.has(c.key)) continue;
            const title = this.cubeMeta.fieldTitleMap.get(c.key) || c.key;
            const nullness = c.expression === QueryExpression.NULL || c.expression === QueryExpression.NOT_NULL;
            if (nullness) {
                // the report maps a null EQ / NEQ value onto NULL / NOT_NULL itself
                filters.push({title, field: c.key, operator: c.expression === QueryExpression.NULL ? CubeOperator.EQ : CubeOperator.NEQ, value: null});
                continue;
            }
            if (c.value === undefined || c.value === null || c.value === '') continue;
            if (c.expression === QueryExpression.RANGE) {
                const [low, high] = Array.isArray(c.value) ? c.value : [c.value, null];
                const hasLow = low !== null && low !== undefined && low !== '';
                const hasHigh = high !== null && high !== undefined && high !== '';
                if (hasLow && hasHigh) filters.push({title, field: c.key, operator: CubeOperator.BETWEEN, value: [low, high]});
                else if (hasLow) filters.push({title, field: c.key, operator: CubeOperator.EGT, value: low});
                else if (hasHigh) filters.push({title, field: c.key, operator: CubeOperator.ELT, value: high});
                continue;
            }
            if (Array.isArray(c.value) && !c.value.length) continue;
            const operator = CubeVisComponent.OPERATORS[c.expression] ?? CubeOperator.EQ;
            filters.push({title, field: c.key, operator, value: c.value});
        }
        return filters;
    }

    // chart click linkage: narrow every chart to the clicked value
    onFilterLink(payload: { field: string; value: any }) {
        if (!payload?.field) return;
        const title = this.cubeMeta?.fieldTitleMap?.get(payload.field) || payload.field;
        const existing = this.linked.find(f => f.field === payload.field);
        if (existing) {
            existing.value = payload.value;
        } else {
            this.linked = [...this.linked, {title, field: payload.field, operator: CubeOperator.EQ, value: payload.value}];
        }
        this.applyFilters();
    }

    removeLink(filter: FilterDSL) {
        this.linked = this.linked.filter(f => f !== filter);
        this.applyFilters();
    }

    clearLinks() {
        this.linked = [];
        this.applyFilters();
    }

}
