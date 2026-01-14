import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, Input} from '@angular/core';
import {Line, Column, Bar, Pie} from '@antv/g2plot';
import {NZ_MODAL_DATA} from 'ng-zorro-antd/modal';
import {CubeMeta} from "../../cube/cube.model";

@Component({
    standalone: false,
    selector: 'app-cube-puzzle-config',
    templateUrl: './cube-puzzle-config.html',
    styleUrl: './cube-puzzle-config.less'
})
export class CubePuzzleConfig implements OnInit, AfterViewInit, OnDestroy {

    readonly nzModalData = inject(NZ_MODAL_DATA, {optional: true});

    @Input() cubeMeta: CubeMeta

    @ViewChild('chartContainer', {static: false}) chartContainer: ElementRef;

    chartType: 'line' | 'column' | 'bar' | 'pie' = 'column';

    config: any = {
        title: '图表标题',
        xField: 'type',
        yField: 'value',
        seriesField: '',
        isStack: false,
        isPercent: false,
        smooth: false,
        legendPosition: 'bottom',
    };

    chart: any;

    chartData = [
        {type: '分类一', value: 27, category: 'A'},
        {type: '分类二', value: 25, category: 'A'},
        {type: '分类三', value: 18, category: 'A'},
        {type: '分类四', value: 15, category: 'A'},
        {type: '分类五', value: 10, category: 'A'},
        {type: '分类一', value: 7, category: 'B'},
        {type: '分类二', value: 5, category: 'B'},
        {type: '分类三', value: 3, category: 'B'},
        {type: '分类四', value: 5, category: 'B'},
        {type: '分类五', value: 10, category: 'B'},
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
                this.config = {...this.config, ...this.nzModalData.config};
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
        }
        const commonConfig = {
            data: this.chartData,
            xField: this.config.xField,
            yField: this.config.yField,
            seriesField: this.config.seriesField || undefined,
            legend: {
                position: this.config.legendPosition,
            },
        };

        switch (this.chartType) {
            case 'line':
                this.chart = new Line(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    smooth: this.config.smooth,
                });
                break;
            case 'column':
                this.chart = new Column(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    isStack: this.config.isStack,
                    isPercent: this.config.isPercent,
                });
                break;
            case 'bar':
                this.chart = new Bar(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    isStack: this.config.isStack,
                    isPercent: this.config.isPercent,
                });
                break;
            case 'pie':
                this.chart = new Pie(this.chartContainer.nativeElement, {
                    ...commonConfig,
                    angleField: this.config.yField,
                    colorField: this.config.xField,
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

}
