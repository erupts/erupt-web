import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Dashboard, FilterControl, FilterDSL} from "../../model/dashboard.model";
import {CubeOperator} from "../../model/cube-query.model";
import {CubeMeta, FieldType} from "../../model/cube.model";
import {CubeApiService} from "../../service/cube-api.service";
import {CubePuzzleFilterControl} from "../cube-puzzle-filter-control/cube-puzzle-filter-control";

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

    @ViewChild("filterControl") filterControl: CubePuzzleFilterControl;

    constructor(private cubeApiService: CubeApiService) {
    }

    ngOnInit(): void {

    }

    clean() {
        this.filterControl.clean();
    }

    fieldType(): FieldType {
        for (let dimension of this.cubeMeta.dimensions) {
            if (dimension.code === this.filter.field) {
                return dimension.type;
            }
        }
        for (let measure of this.cubeMeta.measures) {
            if (measure.code === this.filter.field) {
                return measure.type;
            }
        }
        for (let parameter of this.cubeMeta.parameters) {
            if (parameter.code === this.filter.field) {
                return parameter.type;
            }
        }
        return FieldType.STRING;
    }

    fieldInDimension() {
        if (this.filter.field) {
            return this.cubeMeta.dimensions.find(dim => dim.code === this.filter.field);
        }
        return false;
    }

    changeField(e) {
        switch (this.fieldType()) {
            case FieldType.STRING:
                this.filter.operator = CubeOperator.EQ;
                break;
            case FieldType.NUMBER:
                this.filter.operator = CubeOperator.EQ;

                break;
            case FieldType.DATE_TIME:
                this.filter.operator = CubeOperator.BETWEEN;
                break;
        }
        this.filter.value = null;
        this.filter.defaultValues = null;
        this.filterControl.clean();
    }

    changeOperator(e) {
        if (this.filter.operator === CubeOperator.BETWEEN) {
            this.filter.value = [null, null];
        } else {
            this.filter.value = null;
        }
        this.filter.defaultValues = null;
    }

    protected readonly FilterControl = FilterControl;
    protected readonly CubeOperator = CubeOperator;
    protected readonly FieldType = FieldType;
}
