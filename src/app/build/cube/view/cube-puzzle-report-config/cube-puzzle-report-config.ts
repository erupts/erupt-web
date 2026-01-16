import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, Input} from '@angular/core';
import {Line, Column, Bar, Pie, Area, Scatter, Radar, Funnel} from '@antv/g2plot';
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

    chartData = [
        {input: '分类一', count: 27, category: 'A'},
        {input: '分类二', count: 25, category: 'A'},
        {input: '分类三', count: 18, category: 'A'},
        {input: '分类四', count: 15, category: 'A'},
        {input: '分类五', count: 10, category: 'A'},
        {input: '分类一', count: 7, category: 'B'},
        {input: '分类二', count: 5, category: 'B'},
        {input: '分类三', count: 3, category: 'B'},
        {input: '分类四', count: 5, category: 'B'},
        {input: '分类五', count: 10, category: 'B'},
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
            this.reportDSL.ui = {};
        }
        if (!this.reportDSL.cube[CubeKey.xField]) {
            this.reportDSL.cube[CubeKey.xField] = this.cubeMeta.dimensions?.[0]?.code;
        }
        if (!this.reportDSL.cube[CubeKey.yField]) {
            this.reportDSL.cube[CubeKey.yField] = this.cubeMeta.measures?.[0]?.code;
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
                position: 'middle',
            };
        }
        console.log(commonConfig);

        switch (this.reportDSL.type) {
            case ReportType.LINE:
                this.chart = new Line(this.chartContainer.nativeElement, {
                    ...commonConfig,
                });
                break;
            case ReportType.AREA:
                this.chart = new Area(this.chartContainer.nativeElement, {
                    ...commonConfig,
                });
                break;
            case ReportType.COLUMN:
                this.chart = new Column(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                });
                break;
            case ReportType.BAR:
                this.chart = new Bar(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                });
                break;
            case ReportType.PIE:
                this.chart = new Pie(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    angleField: this.reportDSL.cube[CubeKey.yField] as string,
                    colorField: this.reportDSL.cube[CubeKey.xField] as string,
                    radius: this.reportDSL.ui["innerRadius"] ? 1 : 0.8,
                    innerRadius: this.reportDSL.ui["innerRadius"] || 0,
                    label: {
                        type: 'outer',
                    },
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
        }
        this.chart.render();
    }

    onConfigChange() {
        this.renderChart();
    }

    protected readonly CubeKey = CubeKey;
    protected readonly ReportType = ReportType;
}
