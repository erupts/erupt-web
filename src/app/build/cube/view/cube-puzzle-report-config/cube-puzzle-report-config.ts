import {AfterViewInit, Component, inject, Input, OnInit, ViewChild} from '@angular/core';
import {NZ_MODAL_DATA} from 'ng-zorro-antd/modal';
import {CubeMeta, CubeMetaDimension, CubeMetaMeasure} from "../../model/cube.model";
import {CubeKey, Dashboard, ReportDSL, ReportType} from "../../model/dashboard.model";
import {CubePuzzleReport} from "../cube-puzzle-report/cube-puzzle-report";

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

    @ViewChild('puzzleReport') puzzleReport: CubePuzzleReport;

    constructor() {

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
        if (!this.report.ui) {
            this.report.ui = {
                showXAxis: true,
                showYAxis: true,
                showTooltip: true
            };
        }
        if (this.report.type === ReportType.TABLE) {
            if (!this.report.cube[CubeKey.xField]) {
                this.report.cube[CubeKey.xField] = [this.cubeMeta.dimensions?.[0]?.code];
            }
            if (!this.report.cube[CubeKey.yField]) {
                this.report.cube[CubeKey.yField] = [this.cubeMeta.measures?.[0]?.code];
            }
        } else if (this.report.type === ReportType.PIVOT_TABLE) {
            if (!this.report.cube[CubeKey.rowsField]) {
                this.report.cube[CubeKey.rowsField] = [this.cubeMeta.dimensions?.[0]?.code];
            }
            if (!this.report.cube[CubeKey.columnsField]) {
                this.report.cube[CubeKey.columnsField] = [];
            }
            if (!this.report.cube[CubeKey.valuesField]) {
                this.report.cube[CubeKey.valuesField] = [this.cubeMeta.measures?.[0]?.code];
            }
        } else if (this.report.type === ReportType.KPI) {
            if (!this.report.cube[CubeKey.yField]) {
                this.report.cube[CubeKey.yField] = this.cubeMeta.measures?.[0]?.code;
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

    changeCube() {
        const dimensions = this.selectedDimensions;
        const measures = this.selectedMeasures;
        const sortField = this.report.cube[CubeKey.sortField] as string;
        if (sortField) {
            const isDim = dimensions.some(dim => dim.code === sortField);
            const isMea = measures.some(mea => mea.code === sortField);
            if (!isDim && !isMea) {
                this.report.cube[CubeKey.sortField] = null;
            }
        }
        this.puzzleReport.refresh();
    }

    onConfigChange() {
        if (this.report.type === ReportType.KPI || this.report.type === ReportType.PROGRESS  || this.report.type === ReportType.RING_PROGRESS || this.report.type === ReportType.GAUGE) {
            let yField: string | string[];
            if (Array.isArray(this.report.cube[CubeKey.yField])) {
                yField = this.report.cube[CubeKey.yField][0];
            }else{
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
        } else if (this.report.type == ReportType.PIVOT_TABLE) {
            this.report.cube = {};
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

    toggleSort(field: string | string[]) {
        if (!field) return;
        const fieldStr = Array.isArray(field) ? field[0] : field;
        if (this.report.cube[CubeKey.sortField] === fieldStr) {
            if (this.report.cube[CubeKey.sortDirection] === 'ASC') {
                this.report.cube[CubeKey.sortDirection] = 'DESC';
            } else if (this.report.cube[CubeKey.sortDirection] === 'DESC') {
                this.report.cube[CubeKey.sortField] = null;
                this.report.cube[CubeKey.sortDirection] = null;
            } else {
                this.report.cube[CubeKey.sortDirection] = 'ASC';
            }
        } else {
            this.report.cube[CubeKey.sortField] = fieldStr;
            this.report.cube[CubeKey.sortDirection] = 'ASC';
        }
        this.changeCube();
    }

    protected readonly CubeKey = CubeKey;
    protected readonly ReportType = ReportType;

    get selectedDimensions(): CubeMetaDimension[] {
        if (!this.cubeMeta || !this.cubeMeta.dimensions) return [];
        const selectedCodes = new Set<string>();
        const cube = this.report.cube;

        // Collect all possible dimension selections
        const fields = [CubeKey.xField, CubeKey.seriesField, CubeKey.sourceField, CubeKey.targetField, CubeKey.rowsField, CubeKey.columnsField];
        fields.forEach(key => {
            const val = cube[key];
            if (val) {
                if (Array.isArray(val)) {
                    val.forEach(v => selectedCodes.add(v));
                } else {
                    selectedCodes.add(val as string);
                }
            }
        });

        return this.cubeMeta.dimensions.filter(dim => selectedCodes.has(dim.code));
    }

    get selectedMeasures(): CubeMetaMeasure[] {
        if (!this.cubeMeta || !this.cubeMeta.measures) return [];
        const selectedCodes = new Set<string>();
        const cube = this.report.cube;

        // Collect all possible measure selections
        const fields = [CubeKey.yField, 'yField2', 'sizeField', CubeKey.weightField, CubeKey.valuesField];
        fields.forEach(key => {
            const val = cube[key];
            if (val) {
                if (Array.isArray(val)) {
                    val.forEach(v => selectedCodes.add(v));
                } else {
                    selectedCodes.add(val as string);
                }
            }
        });

        return this.cubeMeta.measures.filter(mea => selectedCodes.has(mea.code));
    }
}
