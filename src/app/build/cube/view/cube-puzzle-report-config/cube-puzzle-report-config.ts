import {AfterViewInit, Component, inject, Input, OnInit, ViewChild} from '@angular/core';
import {NZ_MODAL_DATA} from 'ng-zorro-antd/modal';
import {BaseField, CubeMeta, CubeMetaDimension} from "../../model/cube.model";
import {CubeKey, Dashboard, DashboardDSL, ReportDSL, ReportType} from "../../model/dashboard.model";
import {CubeOperator, CubeOperatorLogin, Direction} from "../../model/cube-query.model";
import {CubePuzzleReport} from "../cube-puzzle-report/cube-puzzle-report";
import {CubeApiService} from "../../service/cube-api.service";

@Component({
    standalone: false,
    selector: 'app-cube-puzzle-config',
    templateUrl: './cube-puzzle-report-config.html',
    styleUrl: './cube-puzzle-report-config.less'
})
export class CubePuzzleReportConfig implements OnInit, AfterViewInit {

    readonly nzModalData = inject(NZ_MODAL_DATA, {optional: true});

    @Input() cubeMeta: CubeMeta;

    @Input() report: ReportDSL;

    @Input() dashboard: Dashboard;

    @Input() dsl: DashboardDSL;

    @ViewChild('puzzleReport') puzzleReport: CubePuzzleReport;

    activeMeta: CubeMeta;
    loadingSubMeta = false;
    private subMetaCache: { [key: string]: CubeMeta } = {};

    constructor(private cubeApiService: CubeApiService) {
    }

    ngOnInit() {
        if (this.nzModalData) {
            if (this.nzModalData.cubeMeta) {
                this.cubeMeta = this.nzModalData.cubeMeta;
            }
            if (this.nzModalData.config) {
                this.report = {...this.report, ...this.nzModalData.config};
            }
        }
        this.activeMeta = this.cubeMeta;
        if (!this.report.sorts) {
            this.report.sorts = [];
        }
        if (!this.report.ui) {
            this.report.ui = {
                showXAxis: true,
                showYAxis: true,
                showTooltip: true
            };
        }
        if (!this.report.filterGroups) {
            this.report.filterGroups = [];
        }
        if (this.report.subModel) {
            this.loadSubModelMeta(this.report.subModel, false);
        } else {
            if (this.report.type === ReportType.TABLE) {
                if (!this.report.cube[CubeKey.xField]) {
                    this.report.cube[CubeKey.xField] = this.cubeMeta.dimensions?.[0] ? [this.cubeMeta.dimensions[0].code] : [];
                }
                if (!this.report.cube[CubeKey.yField]) {
                    this.report.cube[CubeKey.yField] = this.cubeMeta.measures?.[0] ? [this.cubeMeta.measures[0].code] : [];
                }
            } else if (this.report.type === ReportType.PIVOT_TABLE) {
                if (!this.report.cube[CubeKey.rowsField]) {
                    this.report.cube[CubeKey.rowsField] = [];
                }
                if (!this.report.cube[CubeKey.columnsField]) {
                    this.report.cube[CubeKey.columnsField] = [];
                }
                if (!this.report.cube[CubeKey.valuesField]) {
                    this.report.cube[CubeKey.valuesField] = [];
                }
            } else if (this.report.type === ReportType.KPI) {
                if (!this.report.cube[CubeKey.yField]) {
                    this.report.cube[CubeKey.yField] = [];
                }
            } else {
                if (!this.report.cube[CubeKey.xField]) {
                    this.report.cube[CubeKey.xField] = this.cubeMeta.dimensions?.[0]?.code;
                }
                if (!this.report.cube[CubeKey.yField]) {
                    this.report.cube[CubeKey.yField] = this.cubeMeta.measures?.[0]?.code;
                }
            }
        }
    }

    onSubModelChange(alias: string) {
        this.report.cube = {};
        this.report.sorts = [];
        if (!alias) {
            this.activeMeta = this.cubeMeta;
            this.changeCube();
            return;
        }
        this.loadSubModelMeta(alias, true);
    }

    private loadSubModelMeta(alias: string, refreshAfterLoad: boolean) {
        const subModel = this.dsl?.subModels?.find(m => m.id === alias);
        if (!subModel) return;
        const key = `${subModel.cube}/${subModel.explore}`;
        if (this.subMetaCache[key]) {
            this.activeMeta = this.subMetaCache[key];
            if (refreshAfterLoad) this.changeCube();
            return;
        }
        this.loadingSubMeta = true;
        this.cubeApiService.cubeMetadata(subModel.cube, subModel.explore).subscribe(res => {
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
            this.activeMeta = meta;
            this.loadingSubMeta = false;
            if (refreshAfterLoad) this.changeCube();
        });
    }

    ngAfterViewInit() {
        this.changeCube();
    }

    renderChart() {
        this.puzzleReport.render();
    }

    supportSeriesField(type: ReportType): boolean {
        return [
            ReportType.LINE,
            ReportType.AREA,
            ReportType.COLUMN,
            ReportType.BAR,
            ReportType.SCATTER,
            ReportType.RADAR,
            ReportType.WATERFALL,
            ReportType.ROSE,
            ReportType.RADIAL_BAR,
            ReportType.DUAL_AXES,
            ReportType.FUNNEL,
        ].includes(type);
    }

    standardChart(type: ReportType): boolean {
        return [
            ReportType.LINE,
            ReportType.AREA,
            ReportType.BAR,
            ReportType.COLUMN,
            ReportType.PIE,
            ReportType.SCATTER,
            ReportType.RADAR,
            ReportType.FUNNEL,
            ReportType.DUAL_AXES,
            ReportType.WATERFALL,
            ReportType.WORD_CLOUD,
            ReportType.ROSE,
            ReportType.RADIAL_BAR
        ].includes(type);
    }

    get selectedDimensions(): CubeMetaDimension[] {
        let codes: string[] = [];
        if (this.report.type === ReportType.PIVOT_TABLE) {
            if (this.report.cube[CubeKey.rowsField]) {
                codes.push(...this.report.cube[CubeKey.rowsField] as string[]);
            }
            if (this.report.cube[CubeKey.columnsField]) {
                codes.push(...this.report.cube[CubeKey.columnsField] as string[]);
            }
        } else if (this.report.type === ReportType.SANKEY || this.report.type === ReportType.CHORD) {
            if (this.report.cube[CubeKey.sourceField]) {
                codes.push(this.report.cube[CubeKey.sourceField] as string);
            }
            if (this.report.cube[CubeKey.targetField]) {
                codes.push(this.report.cube[CubeKey.targetField] as string);
            }
        } else {
            if (this.report.cube[CubeKey.xField]) {
                if (Array.isArray(this.report.cube[CubeKey.xField])) {
                    codes.push(...this.report.cube[CubeKey.xField]);
                } else {
                    codes.push(this.report.cube[CubeKey.xField] as string);
                }
            }
            if (this.report.cube[CubeKey.seriesField]) {
                if (Array.isArray(this.report.cube[CubeKey.seriesField])) {
                    codes.push(...this.report.cube[CubeKey.seriesField]);
                } else {
                    codes.push(this.report.cube[CubeKey.seriesField] as string);
                }
            }
        }
        return this.activeMeta?.dimensions?.filter(it => codes.includes(it.code)) || [];
    }

    addSort() {
        if (!this.report.sorts) {
            this.report.sorts = [];
        }
        this.report.sorts.push({direction: Direction.ASC});
    }

    removeSort(index: number) {
        this.report.sorts.splice(index, 1);
        this.changeCube();
    }

    changeCube() {
        this.puzzleReport.refresh();
    }

    changeField() {
        if (this.report.sorts) {
            this.report.sorts.forEach(sort => {
                if (sort.field) {
                    const isDimension = this.activeMeta?.dimensions?.some(it => it.code === sort.field);
                    if (isDimension) {
                        const isStillSelected = this.selectedDimensions.some(it => it.code === sort.field);
                        if (!isStillSelected) {
                            sort.field = null;
                        }
                    }
                }
            });
        }
        this.changeCube();
    }

    onConfigChange() {
        if (this.report.type === ReportType.KPI || this.report.type === ReportType.PROGRESS || this.report.type === ReportType.RING_PROGRESS || this.report.type === ReportType.GAUGE) {
            let yField: string | string[];
            if (Array.isArray(this.report.cube[CubeKey.yField])) {
                yField = this.report.cube[CubeKey.yField]?.[0];
            } else {
                yField = this.report.cube[CubeKey.yField] as string;
            }
            this.report.cube = {};
            this.report.cube[CubeKey.yField] = yField;
            this.puzzleReport.refresh()
        } else if (this.report.type == ReportType.TABLE) {
            if (this.report.cube[CubeKey.xField] && !Array.isArray(this.report.cube[CubeKey.xField])) {
                this.report.cube[CubeKey.xField] = [this.report.cube[CubeKey.xField] as string];
            }
            if (this.report.cube[CubeKey.yField] && !Array.isArray(this.report.cube[CubeKey.yField])) {
                this.report.cube[CubeKey.yField] = [this.report.cube[CubeKey.yField] as string];
            }
            this.report.cube[CubeKey.seriesField] = null;
            this.puzzleReport.refresh();
        } else if (this.report.type == ReportType.PIVOT_TABLE) {
            this.report.cube = {}
            this.puzzleReport.refresh();
        } else {
            if (Array.isArray(this.report.cube[CubeKey.xField])) {
                this.report.cube[CubeKey.xField] = this.report.cube[CubeKey.xField][0];
            }
            if (Array.isArray(this.report.cube[CubeKey.yField])) {
                this.report.cube[CubeKey.yField] = this.report.cube[CubeKey.yField][0];
            }
            if (!this.supportSeriesField(this.report.type)) {
                this.report.cube[CubeKey.seriesField] = null;
            }
        }
        this.renderChart();
    }


    addSubGroup() {
        this.report.filterGroups.push({logic: CubeOperatorLogin.AND, conditions: [{}]});
    }

    removeSubGroup(index: number) {
        this.report.filterGroups.splice(index, 1);
    }

    addGroupCondition(groupIndex: number) {
        this.report.filterGroups[groupIndex].conditions.push({});
    }

    removeGroupCondition(groupIndex: number, condIndex: number) {
        this.report.filterGroups[groupIndex].conditions.splice(condIndex, 1);
    }

    get hasAnyFilter(): boolean {
        return this.report.filterGroups?.length > 0;
    }

    protected readonly CubeKey = CubeKey;
    protected readonly ReportType = ReportType;
    protected readonly CubeOperator = CubeOperator;
    protected readonly CubeOperatorLogin = CubeOperatorLogin;
    protected readonly CubeOperatorEntries = Object.entries(CubeOperator) as [string, CubeOperator][];

}
