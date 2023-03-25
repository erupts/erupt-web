import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {PivotSheet} from "@antv/s2";

@Component({
    selector: 'erupt-chart-table',
    templateUrl: './chart-table.component.html',
    styleUrls: ['./chart-table.component.less'],
    styles: [],
})
export class ChartTableComponent implements OnInit, AfterViewInit {

    constructor() {
    }

    @ViewChild('chartTable') chartTable: ElementRef;

    @Input() data: any[];

    ngOnInit() {

    }

    ngAfterViewInit(): void {
        // const s2Options = {
        //     // width: 100,
        //     // height: 300,
        // };
        // console.log(this.chartTable.nativeElement)
        // const s2 = new PivotSheet(document.getElementById(this.chartTable.nativeElement), {
        //     data: [],
        //     fields: {}
        // }, s2Options);
        // s2.render();
    }

    query(data: any[]) {

    }

}
