import {Component, Input, OnInit} from '@angular/core';
import {Dashboard, FilterControl, FilterDSL} from "../../model/dashboard.model";
import {CubeOperator} from "../../model/cube-query.model";
import {CubeMeta} from "../../model/cube.model";
import {CubeApiService} from "../../service/cube-api.service";

@Component({
    selector: 'cube-puzzle-filter-config',
    templateUrl: './cube-puzzle-filter-config.html',
    standalone: false,
    styleUrl: './cube-puzzle-filter-config.less'
})
export class CubePuzzleFilterConfig implements OnInit {

    @Input() filter: FilterDSL;

    @Input() cubeMeta: CubeMeta;

    @Input() dashboard: Dashboard;

    operators = Object.keys(CubeOperator).map(key => ({label: key, value: CubeOperator[key]}));

    constructor(private cubeApiService: CubeApiService) {
    }
    ngOnInit(): void {

    }

    fieldInDimension() {
        if (this.filter.field) {
            return this.cubeMeta.dimensions.find(dim => dim.code === this.filter.field);
        }
        return false;
    }

    protected readonly FilterControl = FilterControl;
    protected readonly CubeOperator = CubeOperator;
}
