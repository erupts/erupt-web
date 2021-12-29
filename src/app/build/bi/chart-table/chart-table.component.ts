import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'app-chart-table',
    templateUrl: './chart-table.component.html',
    styles: [],
})
export class ChartTableComponent implements OnInit {

    constructor() {
    }

    @Input() data: any[];

    ngOnInit() {
    }

}
