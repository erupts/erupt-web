import {Component, Input} from '@angular/core';
import {NzInputDirective} from "ng-zorro-antd/input";
import {NzOptionComponent, NzSelectComponent} from "ng-zorro-antd/select";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {FilterDSL} from "../../model/dashboard.model";
import {CubeOperator} from "../../model/cube-query.model";
import {CubeMeta} from "../../model/cube.model";

@Component({
    selector: 'app-cube-puzzle-filter-config',
    templateUrl: './cube-puzzle-filter-config.html',
    standalone: false,
    styleUrl: './cube-puzzle-filter-config.less'
})
export class CubePuzzleFilterConfig {

    @Input() filter: FilterDSL = {};

    @Input() cubeMeta: CubeMeta;

    operators = Object.keys(CubeOperator).map(key => ({label: key, value: CubeOperator[key]}));

}
