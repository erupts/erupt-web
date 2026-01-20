import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CubeKey, Dashboard, ReportDSL, ReportType} from "../../cube/dashboard.model";
import {NzCardComponent} from "ng-zorro-antd/card";
import {
    NzTableCellDirective,
    NzTableComponent,
    NzTbodyComponent,
    NzTheadComponent,
    NzThMeasureDirective,
    NzTrDirective
} from "ng-zorro-antd/table";
import {CubeApiService} from "../../service/cube-api.service";
import {renderChart} from "../../util/chart.util";

@Component({
    selector: 'cube-puzzle-report',
    imports: [
        NzCardComponent,
        NzTableCellDirective,
        NzTableComponent,
        NzTbodyComponent,
        NzThMeasureDirective,
        NzTheadComponent,
        NzTrDirective
    ],
    templateUrl: './cube-puzzle-report.html',
    styleUrl: './cube-puzzle-report.less'
})
export class CubePuzzleReport implements OnInit, OnDestroy {

    @Input() report: ReportDSL;

    @Input() dashboard: Dashboard;

    @ViewChild('chartContainer', {static: false}) chartContainer: ElementRef;

    querying: boolean = false;

    chartData: Record<string, any>[] = [];

    chart: any;

    constructor(private cubeApiService: CubeApiService) {

    }

    ngOnInit(): void {
        this.refresh();
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
        this.querying = true;
        let dimensions = [];
        let measures = [];
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
        this.cubeApiService.query({
            cube: this.dashboard.cuber,
            explore: this.dashboard.explore,
            dimensions: dimensions,
            measures: measures,
        }).subscribe({
            next: (response) => {
                this.chartData = response.data;
                if (this.report.type != ReportType.TABLE) {
                    this.render();
                }
            },
            complete: () => {
                this.querying = false;
            }
        })
    }

    render() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        this.chart = renderChart(this.chartContainer, this.report, this.chartData)
    }

    ngOnDestroy(): void {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    protected readonly ReportType = ReportType;

    protected readonly CubeKey = CubeKey;
}
