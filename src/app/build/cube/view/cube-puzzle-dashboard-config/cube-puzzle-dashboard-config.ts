import {Component, Input, OnInit} from '@angular/core';
import {DashboardDSL, DashboardTheme} from "../../model/dashboard.model";

@Component({
    selector: 'cube-puzzle-dashboard-config',
    templateUrl: './cube-puzzle-dashboard-config.html',
    standalone: false
})
export class CubePuzzleDashboardConfig implements OnInit {

    @Input() dsl: DashboardDSL;

    constructor() {
    }

    ngOnInit(): void {
    }

    protected readonly DashboardTheme = DashboardTheme;
}
