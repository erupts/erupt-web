import {AfterViewInit, Component, inject, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {NZ_MODAL_DATA} from 'ng-zorro-antd/modal';
import {CubeMeta} from "../../cube/cube.model";
import {CubeKey, Dashboard, ReportDSL, ReportType} from "../../cube/dashboard.model";
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

    changeCube() {
        this.puzzleReport.refresh();
    }

    onConfigChange() {
        if (this.report.type !== ReportType.TABLE) {
            if (Array.isArray(this.report.cube[CubeKey.xField])) {
                this.report.cube[CubeKey.xField] = this.report.cube[CubeKey.xField][0];
            }
            if (Array.isArray(this.report.cube[CubeKey.yField])) {
                this.report.cube[CubeKey.yField] = this.report.cube[CubeKey.yField][0];
            }
        } else {
            if (this.report.cube[CubeKey.xField] && !Array.isArray(this.report.cube[CubeKey.xField])) {
                this.report.cube[CubeKey.xField] = [this.report.cube[CubeKey.xField] as string];
            }
            if (this.report.cube[CubeKey.yField] && !Array.isArray(this.report.cube[CubeKey.yField])) {
                this.report.cube[CubeKey.yField] = [this.report.cube[CubeKey.yField] as string];
            }
        }
        this.renderChart();
    }

    protected readonly CubeKey = CubeKey;
    protected readonly ReportType = ReportType;
}
