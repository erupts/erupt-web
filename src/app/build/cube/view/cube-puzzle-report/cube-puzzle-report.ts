import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
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
export class CubePuzzleReport implements OnInit {

    @Input() report: ReportDSL;

    @Input() dashboard: Dashboard;

    @ViewChild('chartContainer', {static: false}) chartContainer: ElementRef;

    querying: boolean = false;

    chartData: Record<string, any>[] = [];

    constructor(private cubeApiService: CubeApiService) {

    }

    ngOnInit(): void {
        this.querying = true;
        let dimensions = [];
        let measures = [];
        if (this.report.cube[CubeKey.xField]){
            if (Array.isArray(this.report.cube[CubeKey.xField])){
                dimensions = this.report.cube[CubeKey.xField];
            }else{
                dimensions = [this.report.cube[CubeKey.xField]];
            }
        }
        if (this.report.cube[CubeKey.yField]){
            if (Array.isArray(this.report.cube[CubeKey.yField])){
                measures = this.report.cube[CubeKey.yField];
            }else{
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
            },
            complete: () => {
                this.querying = false;
            }
        })
    }

    protected readonly ReportType = ReportType;

    protected readonly CubeKey = CubeKey;
}
