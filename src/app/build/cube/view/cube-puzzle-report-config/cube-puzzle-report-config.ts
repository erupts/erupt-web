import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, Input} from '@angular/core';
import {Line, Column, Bar, Pie} from '@antv/g2plot';
import {NZ_MODAL_DATA} from 'ng-zorro-antd/modal';
import {CubeMeta} from "../../cube/cube.model";
import {CubeKey, ReportDSL} from "../../cube/dashboard.model";

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

    chartType: 'line' | 'column' | 'bar' | 'pie' = 'column';

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
            if (this.nzModalData.chartType) {
                this.chartType = this.nzModalData.chartType;
            }
            if (this.nzModalData.config) {
                this.reportDSL = {...this.reportDSL, ...this.nzModalData.config};
            }
        }
        this.reportDSL.ui = {};
        this.reportDSL.cube[CubeKey.xField] = this.cubeMeta.dimensions?.[0].code;
        this.reportDSL.cube[CubeKey.yField] = this.cubeMeta.measures?.[0].code;
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
                enabled: true,
                position: this.reportDSL.ui["legendPosition"],
            };
        }
        console.log(commonConfig);

        switch (this.chartType) {
            case 'line':
                this.chart = new Line(this.chartContainer.nativeElement, {
                    ...commonConfig,
                });
                break;
            case 'column':
                this.chart = new Column(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                });
                break;
            case 'bar':
                this.chart = new Bar(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    xField: this.reportDSL.cube[CubeKey.xField] as string,
                    yField: this.reportDSL.cube[CubeKey.yField] as string,
                });
                break;
            case 'pie':
                this.chart = new Pie(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    angleField: this.reportDSL.yField,
                    colorField: this.reportDSL.xField,
                    radius: 0.8,
                    label: {
                        type: 'outer',
                    },
                });
                break;
        }
        this.chart.render();
    }

    onConfigChange() {
        this.renderChart();
    }

    protected readonly CubeKey = CubeKey;
}
