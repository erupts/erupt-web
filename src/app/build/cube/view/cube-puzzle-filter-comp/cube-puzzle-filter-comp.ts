import {Component, Input, OnInit} from '@angular/core';
import {FilterDSL} from "../../model/dashboard.model";
import {CubeMeta} from "../../model/cube.model";
import {CubeOperator} from "../../model/cube-query.model";

@Component({
    selector: 'cube-puzzle-filter-comp',
    standalone: false,
    templateUrl: './cube-puzzle-filter-comp.html',
    styleUrl: './cube-puzzle-filter-comp.less'
})
export class CubePuzzleFilterComp implements OnInit {

    @Input() filter: FilterDSL;

    @Input() cubeMeta: CubeMeta;

    ngOnInit(): void {
    }

    protected readonly CubeOperator = CubeOperator;
}
