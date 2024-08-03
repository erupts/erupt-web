import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ChartApi} from "../model/bi.model";

@Component({
    selector: 'erupt-chart-table',
    templateUrl: './chart-table.component.html',
    styleUrls: ['./chart-table.component.less'],
    styles: [],
})
export class ChartTableComponent implements OnInit, AfterViewInit {

    constructor() {
    }

    chart: ChartApi

    // s2: TableSheet;

    @ViewChild('s2t') chartTable: ElementRef;

    ngOnInit() {
    }

    ngAfterViewInit(): void {

    }

    render(chart: ChartApi) {
        this.chart = chart;
    }

}
